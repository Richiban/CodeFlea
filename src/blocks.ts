import * as vscode from "vscode";
import {
    Direction,
    Indentation,
    linqish,
    IndentationRequest,
    opposite,
    Point,
    Parameter,
} from "./common";
import {
    getCursorPosition,
    getEditor,
    moveCursorTo,
    scrollToReveal,
    select,
} from "./editor";
import {
    getRelativeIndentation,
    iterLinePairs,
    LineEnumerationPattern,
    lineIsBlank,
    lineIsStopLine,
} from "./lines";
import { areEqual } from "./points";

type Bounds = { start: { line: number }; end: { line: number } };

export type Block = {
    start: Point;
    end: Point;
};

export type BlockBoundary = Readonly<{
    kind: "block-end" | "block-start";
    point: Point;
}>;

function lineIsBlockStart(
    prevLine: vscode.TextLine | undefined,
    currentLine: vscode.TextLine
) {
    if (!prevLine) return true;
    if (lineIsStopLine(currentLine)) return false;
    if (lineIsStopLine(prevLine)) return true;
    if (getRelativeIndentation(prevLine, currentLine) === "more-indentation")
        return true;

    return false;
}

function lineIsBlockEnd(
    currentLine: vscode.TextLine,
    nextLine: vscode.TextLine | undefined
) {
    if (!nextLine) return true;
    if (currentLine.isEmptyOrWhitespace) return false;
    if (lineIsStopLine(nextLine)) return true;
    if (getRelativeIndentation(currentLine, nextLine) === "less-indentation")
        return true;

    return false;
}

export function selectAllBlocksInCurrentScope() {
    const cursorPosition = getCursorPosition();

    let start: Point = cursorPosition;
    let end: Point = cursorPosition;

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
        start.line,
        start.character,
        end.line,
        end.character
    );
}

export function* iterBlockBoundaries(options: {
    fromPosition: Point;
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
                        yield {
                            kind: kind,
                            point: {
                                line: candidateLine.lineNumber,
                                character:
                                    candidateLine.firstNonWhitespaceCharacterIndex,
                            },
                        };
                        break;
                    case "block-end":
                        yield { kind: kind, point: candidateLine.range.end };
                        break;
                }
            }
        }
    }
}

export function* iterWholeBlocks(options: {
    fromPosition: Point;
    direction?: Direction;
    indentationLevel?: IndentationRequest;
    restrictToCurrentScope?: boolean;
    bounds?: Bounds;
}): Generator<BlockBoundary> {
    let openBlocksSeen = 0;
    let blockStartPoint: Point | undefined = undefined;

    for (const blockBoundary of iterBlockBoundaries(options)) {
        if (blockBoundary.kind === "block-end") {
            openBlocksSeen = Math.max(0, openBlocksSeen - 1);
        } else if (blockBoundary.kind === "block-start" && !blockStartPoint) {
            blockStartPoint = blockBoundary.point;
        }
    }
}

export function getBlocksAroundCursor(
    pattern: LineEnumerationPattern,
    direction: Direction,
    bounds: vscode.Range
) {
    const cursorPosition = getCursorPosition();

    const iterArgs: Parameter<typeof iterBlockBoundaries> = {
        fromPosition: cursorPosition,
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
    let startPosition: Point = editor.selection.anchor;
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
        if (kind != "block-start" || areEqual(point, continuationPoint)) {
            continue;
        }

        select(startPosition, point);
        return;
    }

    if (direction !== "forwards") return;

    let candidateEndLine = undefined;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: continuationPoint,
        direction,
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        if (kind != "block-end") {
            continue;
        }

        if (kind) candidateEndLine = point;
    }

    if (candidateEndLine) select(startPosition, candidateEndLine);
}

export function moveToNextBlockStart(
    direction: Direction,
    indentation: IndentationRequest,
    from?: Point
) {
    from = from ?? getCursorPosition();

    const indent = lineIsBlank(from.line) ? "any-indentation" : indentation;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: from,
        direction,
        indentationLevel: indent,
    })) {
        if (kind != "block-start" || areEqual(from, point)) {
            continue;
        }

        const containingBlock = getContainingBlock(point);
        scrollToReveal(containingBlock.start, containingBlock.end);

        moveCursorTo(point);

        return;
    }
}

export function getContainingBlock(positionInBlock: Point): Block {
    const result = [positionInBlock, positionInBlock];

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: positionInBlock,
        direction: "backwards",
        indentationLevel: "same-indentation",
    })) {
        if (kind == "block-start") {
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

    return { start: result[0], end: result[1] };
}

export function nextBlockEnd(
    direction: Direction,
    indentation: IndentationRequest
) {
    const cursorPosition = getCursorPosition();

    const indent = lineIsBlank(cursorPosition.line)
        ? "any-indentation"
        : indentation;

    for (const { kind, point } of iterBlockBoundaries({
        fromPosition: cursorPosition,
        direction,
        indentationLevel: indent,
    })) {
        if (kind !== "block-end" || areEqual(cursorPosition, point)) {
            continue;
        }

        moveCursorTo(point);

        return;
    }
}
