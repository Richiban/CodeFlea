import { formatWithOptions } from "util";
import * as vscode from "vscode";
import { getVSCodeDownloadUrl } from "vscode-test/out/util";
import {
    Change,
    Direction,
    Indentation,
    DirectionOrNearest,
    linqish,
    IndentationRequest,
    opposite,
    Point,
    Linqish,
    Parameter,
} from "./common";
import {
    getCursorPosition,
    getEditor,
    moveCursorTo,
    scrollToReveal,
    select,
    tryGetLineAt,
} from "./editor";

type Bounds = { start: { line: number }; end: { line: number } };

export type BlockBoundary = Readonly<{
    kind: "block-end" | "block-start";
    point: Point;
}>;

function lineIsBlank(line: number) {
    return getEditor().document.lineAt(line).isEmptyOrWhitespace;
}

function getRelativeIndentation(
    startingLine: vscode.TextLine,
    targetLine: vscode.TextLine
): Indentation {
    if (
        startingLine.firstNonWhitespaceCharacterIndex >
        targetLine.firstNonWhitespaceCharacterIndex
    ) {
        return "less-indentation";
    }

    if (
        startingLine.firstNonWhitespaceCharacterIndex <
        targetLine.firstNonWhitespaceCharacterIndex
    ) {
        return "more-indentation";
    }

    return "same-indentation";
}

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

function fromDirection(direction: Direction) {
    return direction === "forwards"
        ? (x: number) => x + 1
        : (x: number) => x - 1;
}

function* iterLinePairs(
    document: vscode.TextDocument,
    currentLineNumber: number,
    direction: Direction,
    bounds: Bounds = { start: { line: 0 }, end: { line: document.lineCount } }
): Generator<{ prev: vscode.TextLine; current: vscode.TextLine }> {
    for (const [a, b] of iterLines(
        document,
        currentLineNumber,
        direction
    ).pairwise()) {
        if (direction === "forwards") {
            yield { prev: a, current: b };
        } else {
            yield { prev: b, current: a };
        }
    }
}

function toDiff(change: Change) {
    if (change === "greaterThan") return (x: number, y: number) => x > y;
    return (x: number, y: number) => x < y;
}

function* iterLinesOutwards(
    document: vscode.TextDocument,
    currentLineNumber: number
) {
    let forwardsPointer = currentLineNumber + 1;
    let backwardsPointer = currentLineNumber - 1;

    while (forwardsPointerInBounds() && backwardsPointerInBounds()) {
        const backwardsLine = backwardsPointerInBounds()
            ? document.lineAt(backwardsPointer)
            : undefined;
        const forwardsLine = forwardsPointerInBounds()
            ? document.lineAt(forwardsPointer)
            : undefined;

        yield { backwardsLine, forwardsLine };

        forwardsPointer++;
        backwardsPointer--;
    }

    function forwardsPointerInBounds() {
        return forwardsPointer <= document.lineCount;
    }

    function backwardsPointerInBounds() {
        return backwardsPointer >= 0;
    }
}

export function iterLines(
    document: vscode.TextDocument,
    currentLineNumber: number,
    direction: Direction
): Linqish<vscode.TextLine> {
    const advance = fromDirection(direction);

    const withinBounds = () =>
        currentLineNumber >= 0 && currentLineNumber < document.lineCount;

    return new Linqish(
        (function* () {
            while (withinBounds()) {
                yield document.lineAt(currentLineNumber);

                currentLineNumber = advance(currentLineNumber);
            }
        })()
    );
}

export function getNearestLineOfChangeOfIndentation(
    document: vscode.TextDocument,
    currentLine: vscode.TextLine,
    change: Change
) {
    const diff = toDiff(change);

    for (const { backwardsLine, forwardsLine } of iterLinesOutwards(
        document,
        currentLine.lineNumber
    )) {
        if (
            forwardsLine &&
            !forwardsLine.isEmptyOrWhitespace &&
            diff(
                forwardsLine.firstNonWhitespaceCharacterIndex,
                currentLine.firstNonWhitespaceCharacterIndex
            )
        )
            return forwardsLine;

        if (
            backwardsLine &&
            !backwardsLine.isEmptyOrWhitespace &&
            diff(
                backwardsLine.firstNonWhitespaceCharacterIndex,
                currentLine.firstNonWhitespaceCharacterIndex
            )
        )
            return backwardsLine;
    }
}

export function getNextLineOfChangeOfIndentation(
    change: Change,
    direction: Direction,
    document: vscode.TextDocument,
    currentLine: vscode.TextLine
) {
    const diff = toDiff(change);

    for (const line of iterLines(document, currentLine.lineNumber, direction)) {
        if (
            line &&
            !line.isEmptyOrWhitespace &&
            diff(
                line.firstNonWhitespaceCharacterIndex,
                currentLine.firstNonWhitespaceCharacterIndex
            )
        )
            return line;
    }
}

export function moveCursorToNextBlankLine(direction: Direction) {
    const currentPosition = getCursorPosition();

    const nextLine = iterLines(
        getEditor().document,
        currentPosition.line,
        direction
    )
        .skip(1)
        .filter((l) => l.isEmptyOrWhitespace)
        .tryFirst();

    if (nextLine) {
        moveCursorTo(nextLine.range.start);
    }
}

export function moveToChangeOfIndentation(
    change: Change,
    direction: DirectionOrNearest
) {
    const cursorPosition = getCursorPosition();
    const document = getEditor()?.document;

    if (cursorPosition && document) {
        let line: vscode.TextLine | undefined;
        const currentLine = document.lineAt(cursorPosition.line);

        switch (direction) {
            case "nearest": {
                line = getNearestLineOfChangeOfIndentation(
                    document,
                    document.lineAt(cursorPosition.line),
                    change
                );
                break;
            }
            case "backwards":
            case "forwards": {
                line = getNextLineOfChangeOfIndentation(
                    change,
                    direction,
                    document,
                    currentLine
                );
                break;
            }
        }

        if (line) moveCursorTo(line.range.start);
    }
}

export function selectAllBlocksInCurrentScope() {
    const cursorPosition = getCursorPosition();

    let start: Point = cursorPosition;
    let end: Point = cursorPosition;

    for (const blockStart of iterBlocks({
        fromPosition: cursorPosition,
        direction: "backwards",
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        start = blockStart;
    }

    for (const blockEnd of iterBlocks({
        fromPosition: cursorPosition,
        direction: "forwards",
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        end = blockEnd;
    }

    getEditor().selection = new vscode.Selection(
        start.line,
        start.character,
        end.line,
        end.character
    );
}

export function* iterBlocks(options: {
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

        if (lineIsBlockStart(prev, current)) {
            candidateLine = current;
            kind = "block-start";
        } else if (lineIsBlockEnd(prev, current)) {
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

export function getBlocksAroundCursor(
    pattern: LineEnumerationPattern,
    direction: Direction,
    bounds: vscode.Range
) {
    const cursorPosition = getCursorPosition();

    const iterArgs: Parameter<typeof iterBlocks> = {
        fromPosition: cursorPosition,
        direction,
        bounds,
        indentationLevel: "any-indentation",
    };

    const primaryDirection = iterBlocks(iterArgs);

    const secondaryDirection = iterBlocks({
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
        const [blockStart, blockEnd] = getBlockBounds(startPosition);

        if (direction === "forwards") {
            startPosition = blockStart;
        } else {
            startPosition = blockEnd;
        }
    }

    for (const blockBoundary of iterBlocks({
        fromPosition: continuationPoint,
        direction,
        indentationLevel: indentation,
        restrictToCurrentScope: true,
    })) {
        if (
            blockBoundary.kind != "block-start" ||
            areEqual(blockBoundary.point, continuationPoint)
        ) {
            continue;
        }

        select(startPosition, blockBoundary.point);
        return;
    }

    if (direction !== "forwards") return;

    let candidateEndLine = undefined;

    for (const blockBoundary of iterBlocks({
        fromPosition: continuationPoint,
        direction,
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    })) {
        if (blockBoundary.kind != "block-end") {
            continue;
        }

        if (blockBoundary.kind) candidateEndLine = blockBoundary;
    }

    if (candidateEndLine) select(startPosition, candidateEndLine.point);
}

export function moveToNextBlockStart(
    direction: Direction,
    indentation: IndentationRequest
) {
    const cursorPosition = getCursorPosition();

    const indent = lineIsBlank(cursorPosition.line)
        ? "any-indentation"
        : indentation;

    for (const blockBoundary of iterBlocks({
        fromPosition: cursorPosition,
        direction,
        indentationLevel: indent,
    })) {
        if (
            blockBoundary.kind != "block-start" ||
            areEqual(cursorPosition, blockBoundary.point)
        ) {
            continue;
        }

        scrollToReveal(...getBlockBounds(blockBoundary.point));

        moveCursorTo(blockBoundary.point);

        return;
    }
}

export function getBlockBounds(positionInBlock: Point): [Point, Point] {
    const result = [positionInBlock, positionInBlock];

    for (const blockBoundary of iterBlocks({
        fromPosition: positionInBlock,
        direction: "backwards",
        indentationLevel: "same-indentation",
    })) {
        if (blockBoundary.kind == "block-start") {
            result[0] = blockBoundary.point;
            break;
        }
    }

    for (const blockBoundary of iterBlocks({
        fromPosition: positionInBlock,
        direction: "forwards",
        indentationLevel: "same-indentation",
    })) {
        if (blockBoundary.kind === "block-end") {
            result[1] = blockBoundary.point;
            break;
        }
    }

    return result as [Point, Point];
}

export function nextBlockEnd(
    direction: Direction,
    indentation: IndentationRequest
) {
    const cursorPosition = getCursorPosition();

    const indent = lineIsBlank(cursorPosition.line)
        ? "any-indentation"
        : indentation;

    for (const blockBoundary of iterBlocks({
        fromPosition: cursorPosition,
        direction,
        indentationLevel: indent,
    })) {
        if (
            blockBoundary.kind !== "block-end" ||
            areEqual(cursorPosition, blockBoundary.point)
        ) {
            continue;
        }

        moveCursorTo(blockBoundary.point);

        return;
    }
}

export function moveToNextLineSameLevel(direction: Direction) {
    const cursorPosition = getCursorPosition();
    const document = getEditor().document;

    if (cursorPosition && document) {
        const documentLines = iterLines(
            document,
            cursorPosition.line,
            direction
        );

        const currentLine = document.lineAt(cursorPosition.line);

        for (const line of documentLines) {
            if (
                currentLine.firstNonWhitespaceCharacterIndex ===
                    line.firstNonWhitespaceCharacterIndex &&
                !line.isEmptyOrWhitespace
            ) {
                moveCursorTo(line.range.start);
                break;
            }
        }
    }
}

/** A "stop line" is one that is either blank or
 *  contains only punctuation */
export function lineIsStopLine(line: vscode.TextLine) {
    return !/[a-zA-Z0-9]/.test(line.text);
}

export type LineEnumerationPattern = "alternate" | "sequential";

function areEqual(a: Point, b: Point) {
    return a.line === b.line && a.character === b.character;
}
