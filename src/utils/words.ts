import * as vscode from "vscode";
import { Char, Direction, Linqish } from "../common";
import { swap } from "./editor";
import * as positions from "./positions";
import * as selections from "./selectionsAndRanges";
import * as lines from "./lines";

export type SubTextRange = {
    text: string;
    range: { start: number; end: number };
};

type CharClass = "wordStart" | "wordCont" | "operator" | "whitespace";

const separationCharacters = " ,.:=+-*/%\r\n".split("");

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
    {
    }

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
        return new vscode.Range(wordRange.start, wordRange.end);
    }

    return undefined;
}

function getSubwordRangeAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    const line = document.lineAt(position.line);

    const subwords = splitTextIntoSubWords(line.text);

    const range = subwords.find(
        (w) =>
            w.range.start < position.character &&
            w.range.end > position.character
    );

    if (range) {
        return new vscode.Range(
            position.line,
            range.range.start,
            position.line,
            range.range.end
        );
    }

    return undefined;
}

export function expandSelectionToSubwords(
    document: vscode.TextDocument,
    selection: vscode.Selection
) {
    let [newStart, newEnd] = [selection.start, selection.end];

    const leftWord = getSubwordRangeAtPosition(document, selection.start);

    if (leftWord && !selection.start.isEqual(leftWord.start)) {
        newStart = leftWord.start;
    }

    const rightWord = getSubwordRangeAtPosition(document, selection.end);

    if (rightWord && !selection.end.isEqual(rightWord.end)) {
        newEnd = rightWord.end;
    }

    const newSelection = new vscode.Selection(newEnd, newStart);

    if (newSelection.isEmpty) {
        const wordRange = getSubwordRangeAtPosition(
            document,
            newSelection.start
        );

        if (wordRange) {
            return new vscode.Selection(wordRange.end, wordRange.start);
        }
    }

    return newSelection;
}

export function iterSubwords(
    document: vscode.TextDocument,
    fromPosition: vscode.Position,
    direction: Direction
): Linqish<vscode.Range> {
    return new Linqish<vscode.Range>(
        (function* () {
            let isFirstLine = true;

            for (const line of lines.iterLines(
                document,
                fromPosition.line,
                direction
            )) {
                const subwords =
                    direction === "forwards"
                        ? splitTextIntoSubWords(line.text).filter(
                              (sw) =>
                                  !isFirstLine ||
                                  sw.range.start >= fromPosition.character
                          )
                        : splitTextIntoSubWords(line.text)
                              .filter(
                                  (sw) =>
                                      !isFirstLine ||
                                      sw.range.end <= fromPosition.character
                              )
                              .reverse();

                for (const { range } of subwords) {
                    yield new vscode.Range(
                        line.lineNumber,
                        range.start,
                        line.lineNumber,
                        range.end
                    );
                }

                isFirstLine = false;
            }
        })()
    );
}

const segmenter = new (Intl as any).Segmenter("en", {
    granularity: "word",
});

function getCharClass(char: string): CharClass | undefined {
    if (char.length !== 1) {
        return undefined;
    }

    if (char.match(/[a-z]/)) {
        return "wordCont";
    }
    if (char.match(/[0-9]/)) {
        return "wordCont";
    }
    if (char.match(/[A-Z]/)) {
        return "wordStart";
    }
    if (char.match(/\s/)) {
        return "whitespace";
    }

    return "operator";
}

function splitTextIntoSubWords(text: string): SubTextRange[] {
    const results: SubTextRange[] = [];

    let prevCharClass: CharClass | undefined = undefined;
    let currentWord = "";
    let currentWordIndex = 0;
    let index = 0;

    for (const char of text) {
        const charClass = getCharClass(char);

        if (
            currentWord === "" ||
            prevCharClass === charClass ||
            (prevCharClass === "wordStart" && charClass === "wordCont")
        ) {
            currentWord += char;
        } else {
            results.push({
                text: currentWord,
                range: {
                    start: currentWordIndex,
                    end: currentWordIndex + currentWord.length,
                },
            });
            currentWord = char;
            currentWordIndex = index;
        }

        prevCharClass = charClass;
        index++;
    }

    if (currentWord) {
        results.push({
            text: currentWord,
            range: {
                start: currentWordIndex,
                end: currentWordIndex + currentWord.length,
            },
        });
    }

    return results;
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
        selections.tryMap(editor, (selection) => {
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

        if (
            editor.document.getText(charRange).localeCompare(targetChar) === 0
        ) {
            return wordRange;
        }
    }

    return undefined;
}

export function searchSubword(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    targetChar: Char,
    direction: Direction
): vscode.Range | undefined {
    for (const wordRange of iterSubwords(
        document,
        startingPosition,
        direction
    )) {
        const charRange = new vscode.Range(
            wordRange.start,
            wordRange.start.translate(undefined, 1)
        );

        if (
            document.getText(charRange).localeCompare(targetChar, undefined, {
                sensitivity: "base",
            }) === 0
        ) {
            return wordRange;
        }
    }

    return undefined;
}

function getSeparatingText(
    document: vscode.TextDocument,
    wordRange: vscode.Range
): vscode.Range | undefined {
    const wordBefore = iterWords(
        document,
        wordRange.start,
        "backwards"
    ).tryFirst();

    const wordAfter = iterWords(document, wordRange.end, "forwards").tryFirst();

    const separatingTextRangeBefore =
        wordBefore && new vscode.Range(wordBefore.end, wordRange.start);

    const separatingTextRangeAfter =
        wordAfter && new vscode.Range(wordRange.end, wordAfter.start);

    const separatingTextBefore =
        separatingTextRangeBefore &&
        document.getText(separatingTextRangeBefore);

    const separatingTextAfter =
        separatingTextRangeAfter && document.getText(separatingTextRangeAfter);

    if (
        separatingTextAfter &&
        (separatingTextBefore === undefined ||
            separatingTextAfter.length < separatingTextBefore.length) &&
        separatingTextAfter
            .split("")
            .every((c) => separationCharacters.includes(c))
    ) {
        return separatingTextRangeAfter;
    }

    if (
        separatingTextBefore &&
        separatingTextBefore
            .split("")
            .every((c) => separationCharacters.includes(c))
    ) {
        return separatingTextRangeBefore;
    }
}

export function deleteWord(
    document: vscode.TextDocument,
    e: vscode.TextEditorEdit,
    selection: vscode.Selection
): void {
    e.delete(selection);

    const separationText = getSeparatingText(document, selection);

    if (separationText) {
        e.delete(separationText);
    }
}

export function duplicateWord(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    selection: vscode.Selection
): void {
    const separationTextRange = getSeparatingText(document, selection);

    if (separationTextRange) {
        const separationText = document.getText(separationTextRange);

        if (separationTextRange.start <= selection.end) {
            textEdit.insert(selection.end, separationText);
        } else {
            textEdit.insert(selection.start, separationText);
        }
    }

    textEdit.insert(selection.end, document.getText(selection));
}
