import * as vscode from "vscode";
import * as common from "../common";
import { getEditor, moveCursorTo, scrollToReveal, select } from "./editor";
import * as lines from "./lines";

type Bounds = { start: { line: number }; end: { line: number } };

export type BlockBoundary = Readonly<{
    kind: "block-end" | "block-start";
    point: vscode.Position;
}>;

function lineIsBlockStart(
    prevLine: vscode.TextLine | undefined,
    currentLine: vscode.TextLine
) {
    if (!prevLine) {
        return true;
    }
    if (lines.lineIsStopLine(currentLine)) {
        return false;
    }
    if (lines.lineIsStopLine(prevLine)) {
        return true;
    }
    if (
        lines.getRelativeIndentation(prevLine, currentLine) ===
        "more-indentation"
    ) {
        return true;
    }

    return false;
}

function lineIsBlockEnd(
    currentLine: vscode.TextLine,
    nextLine: vscode.TextLine | undefined
) {
    if (!nextLine) {
        return true;
    }
    if (currentLine.isEmptyOrWhitespace) {
        return false;
    }
    if (lines.lineIsStopLine(nextLine)) {
        return true;
    }
    if (
        lines.getRelativeIndentation(currentLine, nextLine) ===
        "less-indentation"
    ) {
        return true;
    }

    return false;
}

export function selectAllBlocksInCurrentScope(cursorPosition: vscode.Position) {
    let start = cursorPosition;
    let end = cursorPosition;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: cursorPosition,
        direction: "backwards",
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        if (kind === "block-start") {
            start = point;
        }
    }

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: cursorPosition,
        direction: "forwards",
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        if (kind === "block-end") {
            end = point;
        }
    }

    getEditor().selection = new vscode.Selection(
        end.line,
        end.character,
        start.line,
        start.character
    );
}

export function iterBlockBoundaries(options: {
    fromPosition: vscode.Position;
    direction?: common.Direction;
    indentationLevel?: common.IndentationRequest;
    restrictToCurrentScope?: boolean;
    bounds?: Bounds;
}): common.Linqish<BlockBoundary> {
    return new common.Linqish(
        (function* () {
            const document = getEditor().document;

            const finalOptions: Required<typeof options> = {
                direction: "forwards",
                indentationLevel: "same-indentation",
                restrictToCurrentScope: false,
                bounds: {
                    start: { line: 0 },
                    end: { line: document.lineCount - 1 },
                },
                ...options,
            };

            const documentLines = lines.iterLinePairs(
                document,
                options.fromPosition.line,
                finalOptions.direction
            );

            for (const { prev, current } of documentLines) {
                let candidateLine: vscode.TextLine | undefined;
                let kind: BlockBoundary["kind"] | undefined;

                if (current && lineIsBlockStart(prev, current)) {
                    candidateLine = current;
                    kind = "block-start";
                } else if (prev && lineIsBlockEnd(prev, current)) {
                    candidateLine = prev;
                    kind = "block-end";
                }

                if (candidateLine && kind) {
                    const relativeIndentation = lines.getRelativeIndentation(
                        document.lineAt(options.fromPosition.line),
                        candidateLine
                    );

                    if (
                        finalOptions.restrictToCurrentScope &&
                        relativeIndentation === "less-indentation"
                    ) {
                        return;
                    }

                    if (
                        finalOptions.indentationLevel === "any-indentation" ||
                        relativeIndentation === finalOptions.indentationLevel
                    ) {
                        switch (kind) {
                            case "block-start":
                                const point = new vscode.Position(
                                    candidateLine.lineNumber,
                                    candidateLine.firstNonWhitespaceCharacterIndex
                                );

                                yield { kind, point };
                                break;
                            case "block-end":
                                yield {
                                    kind: kind,
                                    point: candidateLine.range.end,
                                };
                                break;
                        }
                    }
                }
            }

            if (finalOptions.direction === "forwards") {
                // yield {
                //     kind: "block-end",
                //     point: candidateLine.range.end,
                // };
            } else {
                yield {
                    kind: "block-start",
                    point: new vscode.Position(0, 0),
                };
            }
        })()
    );
}

export function* iterBlocksInCurrentScope(options: {
    fromPosition: vscode.Position;
    direction?: common.Direction;
    indentationLevel?: common.IndentationRequest;
    bounds?: Bounds;
}): Generator<vscode.Range> {
    const boundaries = iterBlockBoundaries(options);
    let currentlyOpenBlock: BlockBoundary | undefined = undefined;

    for (const boundary of boundaries) {
        if (boundary.point.isEqual(options.fromPosition)) {
            continue;
        }

        if (!currentlyOpenBlock) {
            if (
                boundary.kind ===
                (options.direction === "forwards" ? "block-start" : "block-end")
            ) {
                currentlyOpenBlock = boundary;
                continue;
            } else {
                return;
            }
        }

        yield new vscode.Range(currentlyOpenBlock.point, boundary.point);

        currentlyOpenBlock = undefined;
    }
}

export function getBlocksAround(
    startingPosition: vscode.Position,
    pattern: lines.LineEnumerationPattern,
    direction: common.Direction,
    bounds: vscode.Range
) {
    const iterArgs: common.Parameter<typeof iterBlockBoundaries> = {
        fromPosition: startingPosition,
        direction,
        bounds,
        indentationLevel: "any-indentation",
    };

    const primaryDirection = iterBlockBoundaries(iterArgs);

    const secondaryDirection = iterBlockBoundaries({
        ...iterArgs,
        direction: common.opposite(direction),
    });

    switch (pattern) {
        case "alternate":
            return common
                .linqish(primaryDirection)
                .alternateWith(secondaryDirection);
        case "sequential":
            return common.linqish(primaryDirection).concat(secondaryDirection);
    }
}

export function extendBlockSelection(
    direction: common.Direction,
    indentation: common.Indentation
) {
    if (indentation !== "same-indentation") {
        throw new Error("Only 'same-indentation' is currently supported");
    }

    const editor = getEditor();
    let startPosition = editor.selection.anchor;
    const continuationPoint = editor.selection.active;

    if (editor.selection.isEmpty) {
        const { start: blockStart, end: blockEnd } =
            getContainingBlock(startPosition);

        if (direction === "forwards") {
            startPosition = blockStart;
        } else {
            startPosition = blockEnd;
        }
    }

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: continuationPoint,
        direction,
        indentationLevel: indentation,
        restrictToCurrentScope: true,
    })) {
        if (kind !== "block-start" || point.isEqual(continuationPoint)) {
            continue;
        }

        select(startPosition, point);
        return;
    }

    if (direction !== "forwards") {
        return;
    }

    let candidateEndLine = undefined;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: continuationPoint,
        direction,
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        if (kind !== "block-end") {
            continue;
        }

        if (kind) {
            candidateEndLine = point;
        }
    }

    if (candidateEndLine) {
        select(startPosition, candidateEndLine);
    }
}

export function moveToNextBlockStart(
    direction: common.Direction,
    indentation: common.IndentationRequest,
    from: vscode.Position
) {
    const indent = lines.lineIsBlank(from.line)
        ? "any-indentation"
        : indentation;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: from,
        direction,
        indentationLevel: indent,
    })) {
        if (kind !== "block-start" || from.isEqual(point)) {
            continue;
        }

        const containingBlock = getContainingBlock(point);
        scrollToReveal(containingBlock.start, containingBlock.end);

        moveCursorTo(point);

        return;
    }
}

export function getContainingBlock(
    positionInBlock: vscode.Position
): vscode.Range {
    const result = [positionInBlock, positionInBlock];

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: positionInBlock,
        direction: "backwards",
        indentationLevel: "same-indentation",
    })) {
        if (kind === "block-start") {
            result[0] = point;
            break;
        }
    }

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: positionInBlock,
        direction: "forwards",
        indentationLevel: "same-indentation",
    })) {
        if (kind === "block-end") {
            result[1] = point;
            break;
        }
    }

    return new vscode.Range(result[0], result[1]);
}

export function moveToNextBlockEnd(
    startingPosition: vscode.Position,
    direction: common.Direction,
    indentation: common.IndentationRequest
): void {
    const indent = lines.lineIsBlank(startingPosition.line)
        ? "any-indentation"
        : indentation;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: startingPosition,
        direction,
        indentationLevel: indent,
    })) {
        if (kind !== "block-end" || startingPosition.isEqual(point)) {
            continue;
        }

        moveCursorTo(point);

        return;
    }
}

export function getNextBlockInScope(
    startPosition: vscode.Position,
    direction: common.Direction
): vscode.Range | undefined {
    for (const block of iterBlocksInCurrentScope({
        fromPosition: startPosition,
        direction: direction,
    })) {
        return block;
    }
}

export function getFirstLastBlockInScope(
    startPosition: vscode.Position,
    direction: common.Direction
): vscode.Range | undefined {
    let current = undefined;

    for (const block of iterBlocksInCurrentScope({
        fromPosition: startPosition,
        direction: direction,
    })) {
        current = block;
    }

    return current;
}
