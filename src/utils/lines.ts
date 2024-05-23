import * as vscode from "vscode";
import * as common from "../common";
import Seq, { seq } from "./seq";
import * as lineUtils from "../utils/lines";
import { rangeToPosition } from "./selectionsAndRanges";
import { IterationOptions } from "../io/SubjectIOBase";
import { Direction, directionToDelta } from "../common";

export type LinePair =
    | { prev: undefined; current: vscode.TextLine }
    | { prev: vscode.TextLine; current: undefined }
    | { prev: vscode.TextLine; current: vscode.TextLine };

function changeToDiff(change: common.Change) {
    if (change === "greaterThan") {
        return (x: number, y: number) => x > y;
    }
    return (x: number, y: number) => x < y;
}

export function getNearestSignificantLine(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.TextLine {
    const currentLine = document.lineAt(position.line);

    if (currentLine.isEmptyOrWhitespace) {
        const lines = lineUtils.iterLinesOutwards(document, position.line);

        for (const { backwardsLine, forwardsLine } of lines) {
            if (backwardsLine && !backwardsLine.isEmptyOrWhitespace) {
                return backwardsLine;
            }

            if (forwardsLine && !forwardsLine.isEmptyOrWhitespace) {
                return forwardsLine;
            }
        }
    }

    return currentLine;
}

export function rangeWithoutIndentation(line: vscode.TextLine) {
    return line.range.with({
        start: line.range.start.with({
            character: line.firstNonWhitespaceCharacterIndex,
        }),
    });
}

export function getNextLineOfChangeOfIndentation(
    change: common.Change,
    direction: common.Direction,
    document: vscode.TextDocument,
    currentLine: vscode.TextLine
) {
    const diff = changeToDiff(change);

    for (const line of iterLines(document, {
        startingPosition: currentLine.range.start,
        direction,
        currentInclusive: false,
    })) {
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
export function getRelativeIndentation(
    startingLine: vscode.TextLine,
    targetLine: vscode.TextLine
): common.RelativeIndentation {
    if (targetLine.isEmptyOrWhitespace) {
        return "no-indentation";
    }

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

export function iterLinePairs(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<LinePair> {
    return (iterLines(document, { ...options, currentInclusive: true })
        .pairwise() as Seq<[vscode.TextLine, vscode.TextLine]>)
        .map(([a, b]) =>
            options.direction === Direction.forwards
                ? { prev: a, current: b }
                : { prev: b, current: a }
        );
}

export function getNextSignificantLine(
    document: vscode.TextDocument,
    position: vscode.Position,
    direction: common.Direction
): vscode.TextLine | undefined {
    for (const line of iterLines(document, {
        startingPosition: position,
        direction,
        currentInclusive: false,
    })) {
        if (lineIsSignificant(line)) {
            return line;
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

function moveToChangeOfIndentation(
    editor: vscode.TextEditor,
    cursorPosition: vscode.Position,
    change: common.Change,
    direction: common.DirectionOrNearest
) {
    if (cursorPosition && editor.document) {
        let line: vscode.TextLine | undefined;
        const currentLine = editor.document.lineAt(cursorPosition.line);

        switch (direction) {
            case "nearest": {
                line = getNearestLineOfChangeOfIndentation(
                    editor.document,
                    editor.document.lineAt(cursorPosition.line),
                    change
                );
                break;
            }
            case Direction.backwards:
            case Direction.forwards: {
                line = lineUtils.getNextLineOfChangeOfIndentation(
                    change,
                    direction,
                    editor.document,
                    currentLine
                );
                break;
            }
        }

        if (line) {
            editor.selection = new vscode.Selection(
                line.range.start,
                line.range.start
            );
        }
    }
}

export function iterLines(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<vscode.TextLine> {
    const advance = directionToDelta(options.direction);
    let currentLineNumber = rangeToPosition(
        options.startingPosition,
        options.direction
    ).line;

    const withinBounds = () =>
        currentLineNumber >= 0 &&
        (!options.bounds || currentLineNumber >= options.bounds.start.line) &&
        (!options.bounds || currentLineNumber <= options.bounds.end.line) &&
        currentLineNumber < document.lineCount;

    return seq(
        function* () {
            while (withinBounds()) {
                const newLine = document.lineAt(currentLineNumber);

                yield newLine;

                currentLineNumber = advance(currentLineNumber);
            }
        }
    ).skip(options.currentInclusive ? 0 : 1);
}

function getNearestLineOfChangeOfIndentation(
    document: vscode.TextDocument,
    currentLine: vscode.TextLine,
    change: common.Change
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

export function* iterLinesOutwards(
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
