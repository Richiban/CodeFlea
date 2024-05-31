import * as vscode from "vscode";
import * as common from "../common";
import Enumerable from "../utils/Enumerable";
import * as lineUtils from "../utils/lines";
import { positionToRange, rangeToPosition } from "../utils/selectionsAndRanges";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";
import { Direction } from "../common";

type BlockIterationOptions = IterationOptions & {
    indentationLevel?: common.IndentationRequest;
    restrictToCurrentScope?: boolean;
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

function iterBlockStarts(
    document: vscode.TextDocument,
    options: BlockIterationOptions
): Enumerable<vscode.Position> {
    return new Enumerable(
        (function* () {
            options = <typeof options>{
                indentationLevel: "same-indentation",
                currentInclusive: false,
                restrictToCurrentScope: false,
                ...options,
            };

            const documentLines = lineUtils.iterLinePairs(document, {
                ...options,
                startingPosition: rangeToPosition(
                    options.startingPosition,
                    Direction.backwards
                ),
            });

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
                        options.restrictToCurrentScope &&
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
                    }
                }
            }

            if (options.direction === Direction.backwards) {
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
            indentationLevel: "any-indentation",
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
        direction: Direction.forwards,
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
    options: IterationOptions
): Enumerable<vscode.Range> {
    return iterBlockStarts(document, {
        ...options,
        indentationLevel: "same-indentation",
    }).map((point) => getContainingBlock(document, positionToRange(point)));
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
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
    options: IterationOptions
): Enumerable<vscode.Range> {
    return iterBlockStarts(document, {
        ...options,
        indentationLevel: "any-indentation",
    }).map((point) => getContainingBlock(document, positionToRange(point)));
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

function deleteBlock(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    object: vscode.Range
) {
    const nextBlock = iterScope(document, {
        startingPosition: object.end,
        direction: Direction.forwards,
    }).tryFirst();

    if (nextBlock) {
        textEdit.delete(new vscode.Range(object.start, nextBlock.start));

        return positionToRange(object.start);
    }

    const prevBlock = iterScope(document, {
        startingPosition: object.start,
        direction: Direction.backwards,
    }).tryFirst();

    if (prevBlock) {
        textEdit.delete(new vscode.Range(prevBlock.end, object.end));

        return positionToRange(prevBlock.start);
    }

    textEdit.delete(object);

    return positionToRange(object.start);
}

function iterScope(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return iterBlockStarts(document, {
        ...options,
        indentationLevel: "same-indentation",
        restrictToCurrentScope: true,
    }).map((point) => getContainingBlock(document, positionToRange(point)));
}

export default class BlockIO extends SubjectIOBase {
    deletableSeparators = /^\s+$/;
    defaultSeparationText = "\n\n";

    getContainingObjectAt = getContainingRangeAt;
    getClosestObjectTo = getClosestContainingBlock;
    iterAll = iterAll;
    iterHorizontally = iterHorizontally;
    iterVertically = iterVertically;
    iterScope = iterScope;

    deleteObject = deleteBlock;
}
