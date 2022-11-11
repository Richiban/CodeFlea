import * as vscode from "vscode";
import {
    Direction,
    Indentation,
    linqish,
    IndentationRequest,
    opposite,
    Parameter,
} from "../common";
import { getEditor, moveCursorTo, scrollToReveal, select } from "./editor";
import {
    getRelativeIndentation,
    iterLinePairs,
    LineEnumerationPattern,
    lineIsBlank,
    lineIsStopLine,
} from "./lines";

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
    if (lineIsStopLine(currentLine)) {
        return false;
    }
    if (lineIsStopLine(prevLine)) {
        return true;
    }
    if (getRelativeIndentation(prevLine, currentLine) === "more-indentation") {
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
    if (lineIsStopLine(nextLine)) {
        return true;
    }
    if (getRelativeIndentation(currentLine, nextLine) === "less-indentation") {
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

export function* iterBlockBoundaries(options: {
    fromPosition: vscode.Position;
    direction?: Direction;
    indentationLevel?: IndentationRequest;
    restrictToCurrentScope?: boolean;
    bounds?: Bounds;
}): Generator<BlockBoundary> {
    const document = getEditor().document;

    const finalOptions: Required<typeof options> = {
        direction: "forwards",
        indentationLevel: "same-indentation",
        restrictToCurrentScope: false,
        bounds: { start: { line: 0 }, end: { line: document.lineCount - 1 } },
        ...options,
    };

    const documentLines = iterLinePairs(
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
            const relativeIndentation = getRelativeIndentation(
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
                        yield { kind: kind, point: candidateLine.range.end };
                        break;
                }
            }
        }
    }
}

export function* iterBlocksInCurrentScope(options: {
    fromPosition: vscode.Position;
    direction?: Direction;
    indentationLevel?: IndentationRequest;
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
    pattern: LineEnumerationPattern,
    direction: Direction,
    bounds: vscode.Range
) {
    const iterArgs: Parameter<typeof iterBlockBoundaries> = {
        fromPosition: startingPosition,
        direction,
        bounds,
        indentationLevel: "any-indentation",
    };

    const primaryDirection = iterBlockBoundaries(iterArgs);

    const secondaryDirection = iterBlockBoundaries({
        ...iterArgs,
        direction: opposite(direction),
    });

    switch (pattern) {
        case "alternate":
            return linqish(primaryDirection).alternateWith(secondaryDirection);
        case "sequential":
            return linqish(primaryDirection).concat(secondaryDirection);
    }
}

export function extendBlockSelection(
    direction: Direction,
    indentation: Indentation
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
    direction: Direction,
    indentation: IndentationRequest,
    from: vscode.Position
) {
    const indent = lineIsBlank(from.line) ? "any-indentation" : indentation;

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

export function nextBlockEnd(
    startingPosition: vscode.Position,
    direction: Direction,
    indentation: IndentationRequest
) {
    const indent = lineIsBlank(startingPosition.line)
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

export function getNextBlock(startPosition: vscode.Position) {
    for (const block of iterBlocksInCurrentScope({
        fromPosition: startPosition,
        direction: "forwards",
    })) {
        return block;
    }
}

export function getPrevBlock(startPosition: vscode.Position) {
    for (const block of iterBlocksInCurrentScope({
        fromPosition: startPosition,
        direction: "backwards",
    })) {
        return block;
    }
}

export function swapBlocksWithNeighbours(
    editor: vscode.TextEditor,
    direction: Direction
) {
    // const getTargetWord =
    //     direction === "forwards" ? getNextBlock : getPrevBlock;
    // const getEnd: keyof vscode.Range =
    //     direction === "forwards" ? "end" : "start";
    // await editor.edit((e) => {
    //     selections.map(editor, (selection) => {
    //         const targetWordRange = getTargetWord(
    //             editor.document,
    //             selection[getEnd]
    //         );
    //         if (targetWordRange) {
    //             swapWords(editor.document, e, selection, targetWordRange);
    //             return new vscode.Selection(
    //                 targetWordRange?.end,
    //                 targetWordRange?.start
    //             );
    //         }
    //         return selection;
    //     });
    // });
}
