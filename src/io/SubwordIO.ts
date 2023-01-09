import * as vscode from "vscode";
import * as common from "../common";
import Enumerable, { enumerable } from "../utils/Enumerable";
import * as lineUtils from "../utils/lines";
import {
    closerOf,
    positionToRange,
    wordRangeToPosition,
} from "../utils/selectionsAndRanges";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";

type CharClass = "wordStart" | "wordCont" | "operator" | "whitespace";

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

function splitTextIntoSubWords(text: string): common.SubTextRange[] {
    const results: common.SubTextRange[] = [];

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

function iterSubwords(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return new Enumerable<vscode.Range>(
        (function* () {
            let isFirstLine = true;
            const startingPosition = wordRangeToPosition(
                options.startingPosition,
                options.direction
            );

            for (const line of lineUtils.iterLines(document, options)) {
                const subwords =
                    options.direction === "forwards"
                        ? splitTextIntoSubWords(line.text).filter(
                              (sw) =>
                                  !isFirstLine ||
                                  sw.range.start >= startingPosition.character
                          )
                        : splitTextIntoSubWords(line.text)
                              .filter(
                                  (sw) =>
                                      !isFirstLine ||
                                      sw.range.end <= startingPosition.character
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

function iterVertically(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return new Enumerable<vscode.Range>(
        (function* () {
            let isFirstLine = true;
            const startingPosition = wordRangeToPosition(
                options.startingPosition,
                options.direction
            );

            for (const line of lineUtils.iterLines(document, options)) {
                const subwords =
                    options.direction === "forwards"
                        ? splitTextIntoSubWords(line.text).filter(
                              (sw) =>
                                  !isFirstLine ||
                                  sw.range.start >= startingPosition.character
                          )
                        : splitTextIntoSubWords(line.text)
                              .filter(
                                  (sw) =>
                                      !isFirstLine ||
                                      sw.range.end <= startingPosition.character
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

function getClosestRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
) {
    const currentRange = getSubwordRangeAtPosition(document, position);

    if (currentRange) {
        return currentRange;
    }

    const subwordBackwards = iterSubwords(document, {
        startingPosition: positionToRange(position),
        direction: common.Direction.backwards,
    }).tryFirst();

    const subwordForwards = iterSubwords(document, {
        startingPosition: positionToRange(position),
        direction: common.Direction.forwards,
    }).tryFirst();

    if (subwordBackwards && subwordForwards) {
        return closerOf(position, subwordBackwards, subwordForwards);
    }

    if (subwordBackwards) {
        return subwordBackwards;
    }

    if (subwordForwards) {
        return subwordForwards;
    }

    return new vscode.Range(position, position);
}

function iterScope(document: any, options: any): Enumerable<vscode.Range> {
    return new Enumerable<vscode.Range>(
        (function* () {
            const startingPosition = wordRangeToPosition(
                options.startingPosition,
                options.direction
            );

            const line = document.lineAt(startingPosition.line);

            const subwords =
                options.direction === "forwards"
                    ? splitTextIntoSubWords(line.text).filter(
                          (sw) => sw.range.start >= startingPosition.character
                      )
                    : splitTextIntoSubWords(line.text)
                          .filter(
                              (sw) => sw.range.end <= startingPosition.character
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
        })()
    );
}

export default class SubwordIO extends SubjectIOBase {
    deletableSeparators = /^[\s,.:=+\-*\/%]+$/;

    getContainingObjectAt = getSubwordRangeAtPosition;
    getClosestObjectTo = getClosestRangeAt;
    iterAll = iterSubwords;
    iterHorizontally = iterSubwords;
    iterVertically = iterVertically;
    iterScope = iterScope;
}
