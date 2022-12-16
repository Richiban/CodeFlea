import * as vscode from "vscode";
import * as common from "../common";
import Linqish, { linqish } from "../utils/Linqish";
import * as positions from "../utils/positions";
import * as lineUtils from "../utils/lines";
import {
    positionToRange,
    wordRangeToPosition,
} from "../utils/selectionsAndRanges";
import * as editor from "../utils/editor";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";

function iterVertically(
    document: vscode.TextDocument,
    options: IterationOptions
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
                    const wordRange = findWordClosestTo(document, newPosition, {
                        limitToCurrentLine: true,
                    });

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

function iterAll(
    document: vscode.TextDocument,
    options: IterationOptions
): Linqish<vscode.Range> {
    return linqish(function* () {
        let searchPosition: vscode.Position | undefined = wordRangeToPosition(
            options.startingPosition,
            options.direction
        );

        const startingLine = searchPosition.line;
        const diff = options.direction === "forwards" ? 2 : -2;
        let first = true;

        do {
            if (
                options.restrictToCurrentScope &&
                searchPosition.line !== startingLine
            ) {
                return undefined;
            }

            const wordRange = document.getWordRangeAtPosition(searchPosition);

            if (wordRange) {
                if (!first || options.currentInclusive) {
                    yield wordRange;
                }

                searchPosition = positions.translateWithWrap(
                    document,
                    wordRange[
                        options.direction === "forwards" ? "end" : "start"
                    ],
                    diff
                );
            } else {
                searchPosition = positions.translateWithWrap(
                    document,
                    searchPosition,
                    diff
                );
            }

            first = false;
        } while (searchPosition);
    });
}

function getContainingWordAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    return document.getWordRangeAtPosition(position);
}

function findWordClosestTo(
    document: vscode.TextDocument,
    position: vscode.Position,
    options: { limitToCurrentLine: boolean }
): vscode.Range {
    const wordUnderCursor = document.getWordRangeAtPosition(position);

    if (wordUnderCursor) {
        return wordUnderCursor;
    }

    const wordRange = new Linqish([
        iterAll(document, {
            startingPosition: position,
            direction: "backwards",
            restrictToCurrentScope: options.limitToCurrentLine,
        }).tryFirst(),
        iterAll(document, {
            startingPosition: position,
            direction: "forwards",
            restrictToCurrentScope: options.limitToCurrentLine,
        }).tryFirst(),
    ])
        .filterUndefined()
        .tryMinBy((w) => Math.abs(w.end.line - position.line));

    return wordRange ?? new vscode.Range(position, position);
}

export function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const targetWordRange = iterAll(document, {
        startingPosition: range,
        direction,
    }).tryFirst();

    if (targetWordRange) {
        editor.swap(document, edit, range, targetWordRange);

        return targetWordRange;
    }

    return range;
}

export function swapVertically(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const targetWordRange = iterVertically(document, {
        startingPosition: range,
        direction,
    }).tryFirst();

    if (targetWordRange) {
        editor.swap(document, edit, range, targetWordRange);

        return targetWordRange;
    }

    return range;
}

export default class WordIO extends SubjectIOBase {
    deletableSeparators = /^[\s,.:=+\-*\/%]+$/;

    getContainingObjectAt = getContainingWordAt;

    getClosestObjectTo(
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        return findWordClosestTo(document, position, {
            limitToCurrentLine: false,
        });
    }

    iterAll = iterAll;
    iterVertically = iterVertically;
    iterHorizontally = iterAll;

    swapHorizontally = swapHorizontally;
    swapVertically = swapVertically;
}
