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

function splitTextIntoSubWords(
    text: string,
    direction: common.Direction
): common.SubTextRange[] {
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

    return direction === "forwards" ? results : results.reverse();
}

function getSubwordRangeAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    const line = document.lineAt(position.line);

    const subwords = splitTextIntoSubWords(line.text, "forwards");

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

function iterSubwordsOfLine(
    line: vscode.TextLine,
    startingPosition: vscode.Position,
    direction: "forwards" | "backwards"
): Enumerable<common.TextObject> {
    const rangesAfterStartPosition =
        direction === "forwards"
            ? (subText: common.SubTextRange) =>
                  subText.range.start >= startingPosition.character
            : (subText: common.SubTextRange) =>
                  subText.range.end <= startingPosition.character;

    return new Enumerable(splitTextIntoSubWords(line.text, direction))
        .filter(rangesAfterStartPosition)
        .map(
            ({ range }) =>
                new vscode.Range(
                    line.lineNumber,
                    range.start,
                    line.lineNumber,
                    range.end
                )
        );
}

function iterSubwords(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return new Enumerable<vscode.Range>(
        (function* () {
            const startingPosition = wordRangeToPosition(
                options.startingPosition,
                options.direction
            );

            const currentLine = document.lineAt(startingPosition.line);

            yield* iterSubwordsOfLine(
                currentLine,
                startingPosition,
                options.direction
            );

            for (const line of lineUtils.iterLines(document, {
                ...options,
                currentInclusive: false,
            })) {
                const subwords = splitTextIntoSubWords(
                    line.text,
                    options.direction
                );

                for (const { range } of subwords) {
                    yield new vscode.Range(
                        line.lineNumber,
                        range.start,
                        line.lineNumber,
                        range.end
                    );
                }
            }
        })()
    );
}

function iterVertically(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    throw new Error("Not supported. Use VSCode command instead");
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

function iterScope(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    const startingPosition = wordRangeToPosition(
        options.startingPosition,
        options.direction
    );

    const line = document.lineAt(startingPosition.line);

    return iterSubwordsOfLine(line, startingPosition, options.direction);
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
