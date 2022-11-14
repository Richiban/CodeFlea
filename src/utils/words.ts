import * as vscode from "vscode";
import { Char, Direction, Linqish } from "../common";
import { swap } from "./editor";
import * as positions from "./positions";
import * as selections from "./selections";
import * as lines from "./lines";

export function iterWords(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    direction: Direction
) {
    return new Linqish(
        (function* () {
            let nextPosition: vscode.Position | undefined = startingPosition;

            do {
                const wordRange = nextWord(document, nextPosition, direction);

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

export function nextWordUpDown(
    document: vscode.TextDocument,
    currentPosition: vscode.Position,
    direction: "up" | "down"
): vscode.Selection | undefined {
    const nextLine = lines.getNextSignificantLine(
        document,
        currentPosition,
        direction === "down" ? "forwards" : "backwards"
    );

    if (nextLine) {
        return new vscode.Selection(
            currentPosition.with(nextLine.lineNumber),
            currentPosition.with(nextLine.lineNumber)
        );
    }
}

export function nextWord(
    document: vscode.TextDocument,
    currentPosition: vscode.Position,
    direction: Direction
): vscode.Range | undefined {
    let wordRange = undefined;
    let newPosition: vscode.Position | undefined = currentPosition;
    const diff = direction === "forwards" ? 2 : -2;

    do {
        newPosition = positions.translateWithWrap(document, newPosition, diff);

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
        nextWord(document, position, "backwards"),
        nextWord(document, position, "forwards"),
    ]).minBy((w) => Math.abs(w!.end.line - position.line));

    return wordRange;
}

export async function swapWordsWithNeighbors(
    editor: vscode.TextEditor,
    direction: Direction
) {
    const getEnd: keyof vscode.Range =
        direction === "forwards" ? "end" : "start";

    await editor.edit((e) => {
        selections.map(editor, (selection) => {
            const targetWordRange = nextWord(
                editor.document,
                selection[getEnd],
                direction
            );

            if (targetWordRange) {
                swap(editor.document, e, selection, targetWordRange);

                return new vscode.Selection(
                    targetWordRange?.end,
                    targetWordRange?.start
                );
            }

            return selection;
        });
    });
}

export function search(
    editor: vscode.TextEditor,
    startingPosition: vscode.Position,
    targetChar: Char,
    direction: Direction
): vscode.Range | undefined {
    for (const wordRange of iterWords(
        editor.document,
        startingPosition,
        direction
    )) {
        const charRange = new vscode.Range(
            wordRange.start,
            wordRange.start.translate(undefined, 1)
        );

        if (editor.document.getText(charRange) === targetChar) {
            return wordRange;
        }
    }

    return undefined;
}

export function deleteWord(
    editor: vscode.TextEditor,
    e: vscode.TextEditorEdit,
    selection: vscode.Selection
) {
    e.delete(selection);

    let danglingTextRange = new vscode.Range(
        positions.translateWithWrap(editor.document, selection.start, -1) ||
            selection.start,
        selection.start
    );

    let danglingText = editor.document.getText(danglingTextRange);

    const charsToRemove = ":.,".split("");

    while (charsToRemove.includes(danglingText)) {
        e.delete(danglingTextRange);

        danglingTextRange = new vscode.Range(
            positions.translateWithWrap(
                editor.document,
                danglingTextRange.start,
                -1
            ) || danglingTextRange.start,
            danglingTextRange.start
        );
        danglingText = editor.document.getText(danglingTextRange);
    }
}
