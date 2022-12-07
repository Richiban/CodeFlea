import * as vscode from "vscode";
import * as common from "../common";
import * as lines from "./lines";
import * as lineUtils from "../utils/lines";
import {
    positionToRange,
    wordRangeToPosition,
} from "../utils/selectionsAndRanges";

type BlockIterationOptions = common.IterationOptions & {
    indentationLevel?: common.IndentationRequest;
};

function lineIsBlockStart(
    prevLine: vscode.TextLine | undefined,
    currentLine: vscode.TextLine
) {
    if (!prevLine) {
        return true;
    }
    if (lineUtils.lineIsStopLine(currentLine)) {
        return false;
    }
    if (lineUtils.lineIsStopLine(prevLine)) {
        return true;
    }
    if (
        lineUtils.getRelativeIndentation(prevLine, currentLine) ===
        "more-indentation"
    ) {
        return true;
    }

    return false;
}

function lineIsBlockEnd(
    currentLine: vscode.TextLine,
    nextLine: vscode.TextLine | undefined
) {
    if (!nextLine) {
        return true;
    }
    if (currentLine.isEmptyOrWhitespace) {
        return false;
    }
    if (lineUtils.lineIsStopLine(nextLine)) {
        return true;
    }
    if (
        lineUtils.getRelativeIndentation(currentLine, nextLine) ===
        "less-indentation"
    ) {
        return true;
    }

    return false;
}

function iterBlockStarts(
    document: vscode.TextDocument,
    options: BlockIterationOptions
): common.Linqish<vscode.Position> {
    return new common.Linqish(
        (function* () {
            options = <typeof options>{
                indentationLevel: "same-indentation",
                currentInclusive: false,
                restrictToCurrentScope: false,
                ...options,
            };

            const documentLines = lineUtils.iterLinePairs(document, options);
            const startLine = document.lineAt(
                options.startingPosition instanceof vscode.Range
                    ? options.startingPosition.start
                    : options.startingPosition
            );

            for (const { prev, current } of documentLines) {
                if (
                    !options.currentInclusive &&
                    current?.lineNumber === startLine.lineNumber
                ) {
                    continue;
                }

                let candidateLine: vscode.TextLine | undefined;

                if (current && lineIsBlockStart(prev, current)) {
                    candidateLine = current;
                }

                if (candidateLine) {
                    const relativeIndentation =
                        lineUtils.getRelativeIndentation(
                            startLine,
                            candidateLine
                        );

                    if (
                        options.indentationLevel ===
                            "same-indentation-current-scope" &&
                        relativeIndentation === "less-indentation"
                    ) {
                        return;
                    }

                    if (
                        options.indentationLevel === "any-indentation" ||
                        relativeIndentation === options.indentationLevel
                    ) {
                        const point = new vscode.Position(
                            candidateLine.lineNumber,
                            candidateLine.firstNonWhitespaceCharacterIndex
                        );

                        yield point;
                        break;
                    }
                }
            }

            if (options.direction === "backwards") {
                yield new vscode.Position(0, 0);
            }
        })()
    );
}

function findContainingBlockStart(
    document: vscode.TextDocument,
    positionInBlock: vscode.Range | vscode.Position
): vscode.Position {
    return (
        iterBlockStarts(document, {
            startingPosition: positionInBlock,
            direction: common.Direction.backwards,
            currentInclusive: true,
        }).tryFirst() ?? new vscode.Position(0, 0)
    );
}

function findCorrespondingBlockEnd(
    document: vscode.TextDocument,
    blockStart: vscode.Position
): vscode.Position {
    let startingLine = document.lineAt(blockStart.line);
    let candidate = startingLine;

    for (const { prev, current } of lineUtils.iterLinePairs(document, {
        startingPosition: new vscode.Range(blockStart, blockStart),
        direction: "forwards",
        currentInclusive: true,
    })) {
        if (!current || !prev) {
            break;
        }

        const relativeIndentation = lineUtils.getRelativeIndentation(
            startingLine,
            current
        );

        if (relativeIndentation === "less-indentation") {
            break;
        }

        if (relativeIndentation === "more-indentation") {
            candidate = current;
            continue;
        }

        if (current.isEmptyOrWhitespace) {
            continue;
        }

        if (
            lineIsBlockEnd(prev, current) &&
            relativeIndentation === "same-indentation"
        ) {
            candidate = current;
            break;
        }

        if (lineIsBlockStart(prev, current)) {
            break;
        }

        candidate = current;
    }

    return candidate.range.end;
}

function getContainingBlock(
    document: vscode.TextDocument,
    positionInBlock: vscode.Range | vscode.Position
): vscode.Range {
    const blockStart = findContainingBlockStart(document, positionInBlock);
    const blockEnd = findCorrespondingBlockEnd(document, blockStart);

    return new vscode.Range(blockStart, blockEnd);
}

function iterVertically(
    document: vscode.TextDocument,
    options: common.IterationOptions
): common.Linqish<vscode.Range> {
    return iterBlockStarts(document, {
        ...options,
        indentationLevel: "same-indentation",
    }).map((point) => getContainingBlock(document, positionToRange(point)));
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: common.IterationOptions
): common.Linqish<vscode.Range> {
    const indentation =
        options.direction === common.Direction.forwards
            ? "more-indentation"
            : "less-indentation";

    return iterBlockStarts(document, {
        ...options,
        indentationLevel: indentation,
    }).map((point) => getContainingBlock(document, positionToRange(point)));
}

function iterAll(
    document: vscode.TextDocument,
    options: common.IterationOptions
): common.Linqish<vscode.Range> {
    return iterBlockStarts(document, {
        ...options,
        indentationLevel: "any-indentation",
    }).map((point) => getContainingBlock(document, positionToRange(point)));
}

function search(
    document: vscode.TextDocument,
    targetChar: common.Char,
    options: common.IterationOptions
): vscode.Range | undefined {
    const blockPoints = iterAll(document, options);

    for (const { start } of blockPoints) {
        const charRange = new vscode.Range(
            start,
            start.translate({ characterDelta: 1 })
        );

        const char = document.getText(charRange);

        if (char === targetChar) {
            return new vscode.Selection(charRange.end, charRange.start);
        }
    }

    return getContainingBlock(document, options.startingPosition);
}

function getClosestContainingBlock(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    const nearestLine = lineUtils.getNearestSignificantLine(document, position);

    return getContainingBlock(document, nearestLine.range);
}

function getContainingRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    return getContainingBlock(document, positionToRange(position));
}

const reader: common.SubjectReader = {
    getContainingRangeAt,
    getClosestRangeTo: getClosestContainingBlock,
    iterAll,
    iterHorizontally,
    iterVertically,
    search,
};

export default reader;
