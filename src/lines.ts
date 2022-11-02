import * as vscode from "vscode";
import { registerCommand } from "./commands";
import {
    Change,
    Direction,
    Indentation,
    DirectionOrNearest,
    Linqish,
} from "./common";
import { getCursorPosition, getEditor, moveCursorTo } from "./editor";

export type LineEnumerationPattern = "alternate" | "sequential";

export type LinePair =
    | { prev: undefined; current: vscode.TextLine }
    | { prev: vscode.TextLine; current: undefined }
    | { prev: vscode.TextLine; current: vscode.TextLine };

export type Bounds = { start: { line: number }; end: { line: number } };

export function lineIsBlank(line: number) {
    return getEditor().document.lineAt(line).isEmptyOrWhitespace;
}

export function getRelativeIndentation(
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

function directionToDelta(direction: Direction) {
    return direction === "forwards"
        ? (x: number) => x + 1
        : (x: number) => x - 1;
}

export function* iterLinePairs(
    document: vscode.TextDocument,
    currentLineNumber: number,
    direction: Direction,
    bounds: Bounds = { start: { line: 0 }, end: { line: document.lineCount } }
): Generator<LinePair> {
    const lines = iterLines(document, currentLineNumber, direction);

    for (const pair of lines.pairwise()) {
        if (direction === "forwards") {
            yield { prev: pair[0], current: pair[1]! };
        } else {
            yield { prev: pair[1]!, current: pair[0] };
        }
    }
}

function changeToDiff(change: Change) {
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
    const advance = directionToDelta(direction);

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
    const diff = changeToDiff(change);

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
    const diff = changeToDiff(change);

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

@registerCommand("codeFlea.nearestInnerLine")
class NearestInnerLineCommand {
    execute() {
        moveToChangeOfIndentation("greaterThan", "nearest");
    }
}

@registerCommand("codeFlea.nearestOuterLine")
class NearestOuterLineCommand {
    execute() {
        moveToChangeOfIndentation("lessThan", "nearest");
    }
}

@registerCommand("codeFlea.nextInnerLine")
class NextInnerLineCommand {
    execute() {
        moveToChangeOfIndentation("greaterThan", "forwards");
    }
}

@registerCommand("codeFlea.prevOuterLine")
class PrevOuterLineCommand {
    execute() {
        moveToChangeOfIndentation("lessThan", "backwards");
    }
}

@registerCommand("codeFlea.nextSameLine")
class NextSameLineCommand {
    execute() {
        moveToNextLineSameLevel("forwards");
    }
}

@registerCommand("codeFlea.prevSameLine")
class PrevSameLineCommand {
    execute() {
        moveToNextLineSameLevel("backwards");
    }
}

@registerCommand("codeFlea.nextBlankLine")
class NextBlankLineCommand {
    execute() {
        moveCursorToNextBlankLine("forwards");
    }
}

@registerCommand("codeFlea.prevBlankLine")
class PrevBlankLineCommand {
    execute() {
        moveCursorToNextBlankLine("backwards");
    }
}
