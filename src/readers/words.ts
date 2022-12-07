import * as vscode from "vscode";
import { Char, Direction, Linqish, SubjectReader } from "../common";
import * as positions from "../utils/positions";
import * as lineUtils from "../utils/lines";

function iterVertically(
    document: vscode.TextDocument,
    currentPosition: vscode.Position,
    direction: Direction
): Linqish<vscode.Range> {
    return new Linqish(
        (function* () {
            let cont = true;

            while (cont) {
                cont = false;

                const nextLine = lineUtils.getNextSignificantLine(
                    document,
                    currentPosition,
                    direction
                );

                if (nextLine) {
                    const newPosition = currentPosition.with(
                        nextLine.lineNumber
                    );
                    const wordRange = findWordClosestTo(document, newPosition);

                    if (wordRange) {
                        yield wordRange;

                        currentPosition = newPosition;
                        cont = true;
                    }
                }
            }
        })()
    );
}

function iterHorizontally(
    document: vscode.TextDocument,
    currentPosition: vscode.Position,
    direction: Direction
): Linqish<vscode.Range> {
    return new Linqish(
        (function* () {
            let wordRange = undefined;
            let newPosition: vscode.Position | undefined = currentPosition;
            const diff = direction === "forwards" ? 2 : -2;

            do {
                const nextPosition = positions.translateWithWrap(
                    document,
                    newPosition,
                    diff
                );

                if (nextPosition.isEqual(newPosition)) {
                    newPosition = undefined;
                } else {
                    newPosition = nextPosition;
                }

                if (newPosition) {
                    wordRange = document.getWordRangeAtPosition(newPosition);
                }
            } while (!wordRange && newPosition);

            if (wordRange) {
                yield new vscode.Range(wordRange.start, wordRange.end);
            }
        })()
    );
}

function expandSelectionToWords(
    document: vscode.TextDocument,
    selection: vscode.Selection
): vscode.Range {
    let [newStart, newEnd] = [selection.start, selection.end];

    const leftWord = document.getWordRangeAtPosition(selection.start);

    if (leftWord && !selection.start.isEqual(leftWord.start)) {
        newStart = leftWord.start;
    }

    const rightWord = document.getWordRangeAtPosition(selection.end);

    if (rightWord && !selection.end.isEqual(rightWord.end)) {
        newEnd = rightWord.end;
    }

    const newSelection = new vscode.Selection(newEnd, newStart);

    if (newSelection.isEmpty) {
        const wordRange = findWordClosestTo(document, newSelection.start);

        if (wordRange) {
            return new vscode.Selection(wordRange.end, wordRange.start);
        }
    }

    return newSelection;
}

function findWordClosestTo(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    const wordRange = new Linqish([
        iterHorizontally(document, position, "backwards").tryFirst(),
        iterHorizontally(document, position, "forwards").tryFirst(),
    ]).minBy((w) => Math.abs(w!.end.line - position.line));

    return wordRange ?? new vscode.Range(position, position);
}

function search(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    targetChar: Char,
    direction: Direction
): vscode.Range | undefined {
    for (const wordRange of iterHorizontally(
        document,
        startingPosition,
        direction
    )) {
        const charRange = new vscode.Range(
            wordRange.start,
            wordRange.start.translate(undefined, 1)
        );

        if (document.getText(charRange).localeCompare(targetChar) === 0) {
            return wordRange;
        }
    }

    return undefined;
}

function getContainingRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    return document.getWordRangeAtPosition(position);
}

function getClosestRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    return findWordClosestTo(document, position);
}

const reader: SubjectReader = {
    getContainingRangeAt,
    getClosestRangeTo: getClosestRangeAt,
    iterAll: iterHorizontally,
    iterHorizontally,
    iterVertically,
    search,
};

export default reader;
