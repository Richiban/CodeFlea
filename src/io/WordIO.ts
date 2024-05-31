import * as vscode from "vscode";
import * as common from "../common";
import Enumerable, { enumerable } from "../utils/Enumerable";
import * as positions from "../utils/positions";
import * as lineUtils from "../utils/lines";
import {
    positionToRange,
    rangeToPosition,
} from "../utils/selectionsAndRanges";
import * as editor from "../utils/editor";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";
import { Direction } from "../common";

function iterVertically(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return new Enumerable(
        (function* () {
            let cont = true;
            let currentPosition = rangeToPosition(
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
): Enumerable<vscode.Range> {
    return enumerable(function* () {
        let searchPosition: vscode.Position | undefined = rangeToPosition(
            options.startingPosition,
            options.direction
        );

        const diff = options.direction === Direction.forwards ? 2 : -2;
        let first = true;

        do {
            const wordRange = document.getWordRangeAtPosition(searchPosition);

            if (wordRange) {
                if (!first || options.currentInclusive) {
                    yield wordRange;
                }

                searchPosition = positions.translateWithWrap(
                    document,
                    wordRange[
                        options.direction === Direction.forwards ? "end" : "start"
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

    const iterObjects = options.limitToCurrentLine ? iterScope : iterAll;

    const wordRange = new Enumerable([
        iterObjects(document, {
            startingPosition: position,
            direction: Direction.backwards,
        }).tryFirst(),
        iterObjects(document, {
            startingPosition: position,
            direction: Direction.forwards,
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

function iterScope(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return enumerable(function* () {
        let searchPosition: vscode.Position | undefined = rangeToPosition(
            options.startingPosition,
            options.direction
        );

        const startingLine = searchPosition.line;

        const diff = options.direction === Direction.forwards ? 2 : -2;
        let first = true;

        do {
            const wordRange = document.getWordRangeAtPosition(searchPosition);

            if (wordRange) {
                if (options.currentInclusive || !first) {
                    yield wordRange;
                }

                searchPosition = positions.translateWithWrap(
                    document,
                    options.direction === Direction.forwards
                        ? wordRange.end
                        : wordRange.start,
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
        } while (searchPosition && searchPosition.line === startingLine);
    });
}

export default class WordIO extends SubjectIOBase {
    deletableSeparators = /^[\s,.:=+\-*\/%]+$/;
    defaultSeparationText = " ";

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
    iterScope = iterScope;
}
