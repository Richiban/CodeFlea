import * as vscode from "vscode";
import * as common from "../common";
import Linqish from "../utils/Linqish";
import * as positions from "../utils/positions";
import * as lineUtils from "../utils/lines";
import {
    positionToRange,
    wordRangeToPosition,
} from "../utils/selectionsAndRanges";

function iterVertically(
    document: vscode.TextDocument,
    options: common.IterationOptions
): Linqish<vscode.Range> {
    return new Linqish(
        (function* () {
            let cont = true;
            let currentPosition = wordRangeToPosition(
                options.startingPosition,
                options.direction
            );

            while (cont) {
                cont = false;

                const nextLine = lineUtils.getNextSignificantLine(
                    document,
                    currentPosition,
                    options.direction
                );

                if (nextLine) {
                    const newPosition = currentPosition.with(
                        nextLine.lineNumber
                    );
                    const wordRange = findWordClosestTo(document, newPosition);

                    if (wordRange) {
                        yield wordRange;

                        options.startingPosition = positionToRange(newPosition);
                        cont = true;
                    }
                }
            }
        })()
    );
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: common.IterationOptions
): Linqish<vscode.Range> {
    return new Linqish(
        (function* () {
            let wordRange = undefined;
            let newPosition: vscode.Position | undefined = wordRangeToPosition(
                options.startingPosition,
                options.direction
            );

            const diff = options.direction === "forwards" ? 2 : -2;

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
        iterHorizontally(document, {
            startingPosition: position,
            direction: "backwards",
        }).tryFirst(),
        iterHorizontally(document, {
            startingPosition: position,
            direction: "forwards",
        }).tryFirst(),
    ]).minBy((w) => Math.abs(w!.end.line - position.line));

    return wordRange ?? new vscode.Range(position, position);
}

function search(
    document: vscode.TextDocument,
    targetChar: common.Char,
    options: common.IterationOptions
): vscode.Range | undefined {
    for (const wordRange of iterHorizontally(document, options)) {
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

const reader: common.SubjectReader = {
    getContainingRangeAt,
    getClosestRangeTo: getClosestRangeAt,
    iterAll: iterHorizontally,
    iterHorizontally,
    iterVertically,
    search,
};

export default reader;
