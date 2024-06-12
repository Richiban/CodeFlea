import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";
import {
    closerOf,
    positionToRange,
    rangeToPosition,
} from "../utils/selectionsAndRanges";
import Seq, { seq } from "../utils/seq";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";
import * as editor from "../utils/editor";
import { Direction, TextObject } from "../common";

type CharClass = "word" | "operator" | "whitespace";

function* enumerate(text: string) {
    var index = 0;

    for (const c of text) {
        yield [index, c] as const;

        index++;
    }
}

function getCharClass(char: string): CharClass | undefined {
    if (char.match(/[a-zA-Z0-9]/)) {
        return "word";
    }

    if (char.match(/\s/)) {
        return "whitespace";
    }

    return "operator";
}

function split(text: string, startingCharacter: number): common.SubTextRange[] {
    return seq(function* () {
        let prevCharClass: CharClass | undefined = undefined;
        let current: { text: string; startIndex: number } | undefined;

        for (const [index, char] of enumerate(text)) {
            if (index < startingCharacter) continue;
            const charClass = getCharClass(char);

            if (charClass === "word") {
                if (current) {
                    yield current;
                    current = undefined;
                }
                continue;
            } else {
                if (charClass === prevCharClass && current) {
                    current.text += char;
                } else {
                    if (current) {
                        yield current;
                    }

                    current = { text: char, startIndex: index };
                }

                prevCharClass = charClass;
            }
        }

        if (current) {
            yield current;
        }
    })
        .map((r) => ({
            text: r.text,
            range: { start: r.startIndex, end: r.startIndex + r.text.length },
        }))
        .toArray();
}

export function getContainingRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    const line = document.lineAt(position.line);

    const subwords = split(line.text, line.firstNonWhitespaceCharacterIndex);

    const range = subwords.find(
        (w) =>
            w.range.start <= position.character &&
            w.range.end >= position.character
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

export function getClosestRangeTo(
    document: vscode.TextDocument,
    position: vscode.Position
) {
    const currentRange = getContainingRangeAt(document, position);

    if (currentRange) {
        return currentRange;
    }

    const subwordBackwards = iterAll(document, {
        startingPosition: positionToRange(position),
        direction: common.Direction.backwards,
    }).tryFirst();

    const subwordDirectionForwards = iterAll(document, {
        startingPosition: positionToRange(position),
        direction: common.Direction.forwards,
    }).tryFirst();

    if (subwordBackwards && subwordDirectionForwards) {
        return closerOf(position, subwordBackwards, subwordDirectionForwards);
    }

    if (subwordBackwards) {
        return subwordBackwards;
    }

    if (subwordDirectionForwards) {
        return subwordDirectionForwards;
    }

    return positionToRange(position);
}

export function iterAll(
    document: vscode.TextDocument,
    options: IterationOptions
) {
    return seq(function* () {
        let isFirstLine = true;
        const startingPosition = rangeToPosition(
            options.startingPosition,
            options.direction
        );

        for (const line of lineUtils.iterLines(document, {
            ...options,
            currentInclusive: true,
        })) {
            const subwords =
                options.direction === Direction.forwards
                    ? split(
                          line.text,
                          line.firstNonWhitespaceCharacterIndex
                      ).filter(
                          (sw) =>
                              !isFirstLine ||
                              sw.range.start >= startingPosition.character
                      )
                    : split(line.text, line.firstNonWhitespaceCharacterIndex)
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
    });
}

function findBest(
    parts: common.SubTextRange[],
    startingPosition: vscode.Position
): common.SubTextRange | undefined {
    return (
        parts.find(
            (part) =>
                part.range.end >= startingPosition.character &&
                part.range.start <= startingPosition.character
        ) ??
        parts.find((part) => part.range.start >= startingPosition.character) ??
        parts.find((part) => part.range.end <= startingPosition.character)
    );
}

export function iterVertically(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    return seq(function* () {
        const startingPosition = rangeToPosition(
            options.startingPosition,
            options.direction
        );

        for (const line of lineUtils.iterLines(document, options)) {
            const interWords = split(
                line.text,
                line.firstNonWhitespaceCharacterIndex
            );

            const match = findBest(interWords, startingPosition);

            if (match) {
                yield new vscode.Range(
                    line.lineNumber,
                    match.range.start,
                    line.lineNumber,
                    match.range.end
                );
            }
        }
    });
}

export function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const getEnd: keyof vscode.Range =
        direction === Direction.forwards ? "end" : "start";

    const targetWordRange = iterAll(document, {
        startingPosition: range[getEnd],
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
    const getEnd: keyof vscode.Range =
        direction === Direction.forwards ? "end" : "start";

    const targetWordRange = iterVertically(document, {
        startingPosition: range[getEnd],
        direction,
    }).tryFirst();

    if (targetWordRange) {
        editor.swap(document, edit, range, targetWordRange);

        return targetWordRange;
    }

    return range;
}

export function iterScope(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    return seq(function* () {
        const startingPosition = rangeToPosition(
            options.startingPosition,
            options.direction
        );

        const line = document.lineAt(startingPosition);

        const subwords =
            options.direction === Direction.forwards
                ? split(
                      line.text,
                      line.firstNonWhitespaceCharacterIndex
                  ).filter((sw) => sw.range.start >= startingPosition.character)
                : split(line.text, line.firstNonWhitespaceCharacterIndex)
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
    });
}

export default class InterwordIO extends SubjectIOBase {
    deletableSeparators = /^$/;
    defaultSeparationText = " ";

    getContainingObjectAt = getContainingRangeAt;
    getClosestObjectTo = getClosestRangeTo;
    iterAll = iterAll;
    iterVertically = iterVertically;
    iterHorizontally = iterAll;
    iterScope = iterScope;

    getSeparatingText() {
        return undefined;
    }
}
