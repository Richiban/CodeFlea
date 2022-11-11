import * as vscode from "vscode";
import { Direction, Linqish } from "../common";
import * as positions from "./positions";
import * as selections from "./selections";

export function iterWords(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    direction: Direction
) {
    return new Linqish(
        (function* () {
            let nextPosition: vscode.Position | undefined = startingPosition;

            let advance = direction === "forwards" ? nextWord : prevWord;

            do {
                const wordRange = advance(document, nextPosition);

                if (wordRange) {
                    yield wordRange;

                    nextPosition =
                        direction === "forwards"
                            ? wordRange.end
                            : wordRange.start;
                } else {
                    nextPosition = undefined;
                }
            } while (nextPosition);
        })()
    );
}

export function nextWord(
    document: vscode.TextDocument,
    currentPosition: vscode.Position
): vscode.Range | undefined {
    let wordRange = undefined;
    let newPosition: vscode.Position | undefined = currentPosition;

    do {
        newPosition = positions.translateWithWrap(document, newPosition, 2);

        if (newPosition) {
            wordRange = document.getWordRangeAtPosition(newPosition);
        }
    } while (!wordRange && newPosition);

    if (wordRange) {
        return new vscode.Range(wordRange.start, wordRange.end);
    }

    return undefined;
}

export function prevWord(
    document: vscode.TextDocument,
    currentPosition: vscode.Position
): vscode.Range | undefined {
    let wordRange = undefined;
    let newPosition: vscode.Position | undefined = currentPosition;

    do {
        newPosition = positions.translateWithWrap(document, newPosition, -2);

        if (newPosition) {
            wordRange = document.getWordRangeAtPosition(newPosition);
        }
    } while (!wordRange && newPosition);

    if (wordRange) {
        return new vscode.Range(wordRange.start, wordRange.end);
    }

    return undefined;
}

export function expandSelectionToWords(
    document: vscode.TextDocument,
    selection: vscode.Selection
): vscode.Range | undefined {
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
) {
    const wordRange = new Linqish([
        prevWord(document, position),
        nextWord(document, position),
    ]).minBy((w) => Math.abs(w!.end.line - position.line));

    return wordRange;
}

export function swapWords(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    origin: vscode.Range,
    target: vscode.Range
) {
    const originalText = document.getText(origin);
    const targetText = document.getText(target);

    edit.replace(target, originalText);
    edit.replace(origin, targetText);

    return target;
}

export async function swapWordsWithNeighbours(
    editor: vscode.TextEditor,
    direction: Direction
) {
    const getTargetWord = direction === "forwards" ? nextWord : prevWord;
    const getEnd: keyof vscode.Range =
        direction === "forwards" ? "end" : "start";

    await editor.edit((e) => {
        selections.map(editor, (selection) => {
            const targetWordRange = getTargetWord(
                editor.document,
                selection[getEnd]
            );

            if (targetWordRange) {
                swapWords(editor.document, e, selection, targetWordRange);

                return new vscode.Selection(
                    targetWordRange?.end,
                    targetWordRange?.start
                );
            }

            return selection;
        });
    });
}
