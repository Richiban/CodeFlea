import * as vscode from "vscode";
import {
    Change,
    Direction,
    DirectionOrNearest,
    Indentation,
    Linqish,
} from "../common";
import { getEditor, moveCursorTo } from "./editor";

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
    if (change === "greaterThan") {
        return (x: number, y: number) => x > y;
    }
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
        ) {
            return forwardsLine;
        }

        if (
            backwardsLine &&
            !backwardsLine.isEmptyOrWhitespace &&
            diff(
                backwardsLine.firstNonWhitespaceCharacterIndex,
                currentLine.firstNonWhitespaceCharacterIndex
            )
        ) {
            return backwardsLine;
        }
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
        ) {
            return line;
        }
    }
}

export function moveCursorToNextBlankLine(
    currentPosition: vscode.Position,
    direction: Direction
) {
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
    cursorPosition: vscode.Position,
    change: Change,
    direction: DirectionOrNearest
) {
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

        if (line) {
            moveCursorTo(line.range.start);
        }
    }
}

export function moveToNextLineSameLevel(
    cursorPosition: vscode.Position,
    direction: Direction
) {
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

export function lineIsSignificant(line: vscode.TextLine) {
    return !lineIsStopLine(line);
}

export function getNextSignificantLine(
    document: vscode.TextDocument,
    position: vscode.Position,
    direction: Direction
): vscode.TextLine | undefined {
    for (const line of iterLines(document, position.line, direction).skip(1)) {
        if (lineIsSignificant(line)) {
            return line;
        }
    }
}

export function swapLineSideways(
    document: vscode.TextDocument,
    position: vscode.Position,
    edit: vscode.TextEditorEdit,
    direction: "left" | "right"
): vscode.Range | undefined {
    const sourceLine = document.lineAt(position.line);
    const targetIndentation: Change =
        direction === "right" ? "greaterThan" : "lessThan";
    const lineDirection: Direction =
        direction === "right" ? "forwards" : "backwards";

    const targetLine = getNextLineOfChangeOfIndentation(
        targetIndentation,
        lineDirection,
        document,
        sourceLine
    );

    if (targetLine) {
        const sourceLineRange = sourceLine.rangeIncludingLineBreak;
        const newLineText =
            targetLine.text.substring(
                0,
                targetLine.firstNonWhitespaceCharacterIndex
            ) +
            document
                .getText(sourceLineRange)
                .substring(sourceLine.firstNonWhitespaceCharacterIndex);

        edit.insert(targetLine.range.start, newLineText);
        edit.delete(sourceLineRange);

        return new vscode.Range(
            new vscode.Position(
                targetLine.lineNumber,
                sourceLine.range.start.character
            ),
            new vscode.Position(
                targetLine.lineNumber,
                sourceLine.range.end.character
            )
        );
    }
}

export function duplicate(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    selection: vscode.Selection
) {
    const startLine = document.lineAt(selection.start.line);
    const endLine = document.lineAt(selection.end.line);

    const linesToDuplicate = document.getText(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    textEdit.insert(startLine.range.start, linesToDuplicate);
}
