import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";
import {
    closerOf,
    positionToRange,
    wordRangeToPosition as rangeToPosition,
} from "../utils/selectionsAndRanges";

type CharClass = "word" | "operator";

function* enumerate(text: string) {
    var index = 0;

    for (const c of text) {
        yield [index, c] as const;

        index++;
    }
}

function getCharClass(char: string): CharClass | undefined {
    // if (char.length !== 1) {
    //     return undefined;
    // }

    if (char.match(/[a-zA-Z0-9]/)) {
        return "word";
    }
    // if (char.match(/\s/)) {
    //     return "whitespace";
    // }

    return "operator";
}

function split(text: string, startingCharacter: number): common.SubTextRange[] {
    return common
        .linqish(function* () {
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

function getContainingRangeAt(
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

function getClosestRangeTo(
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

    const subwordForwards = iterAll(document, {
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

    return positionToRange(position);
}

function iterAll(
    document: vscode.TextDocument,
    options: common.IterationOptions
) {
    return common.linqish(function* () {
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
                options.direction === "forwards"
                    ? split(
                          line.text,
                          line.firstNonWhitespaceCharacterIndex
                      ).filter(
                          (sw) =>
                              !isFirstLine ||
                              sw.range.start > startingPosition.character
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

            if (options.restrictToCurrentScope) {
                break;
            }
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

function iterVertically(
    document: vscode.TextDocument,
    options: common.IterationOptions
): common.Linqish<vscode.Range> {
    return new common.Linqish<vscode.Range>(
        (function* () {
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
        })()
    );
}

function search(
    document: vscode.TextDocument,
    targetChar: common.Char,
    options: common.IterationOptions
): vscode.Range | undefined {
    for (const wordRange of iterAll(document, options)) {
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

const reader: common.SubjectReader = {
    getContainingRangeAt,
    getClosestRangeTo,
    iterAll,
    iterVertically,
    iterHorizontally: iterAll,
    search,
};

export default reader;
