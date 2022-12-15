import * as vscode from "vscode";
import * as common from "../common";
import Linqish from "../utils/Linqish";
import * as lines from "./LineIO";
import * as lineUtils from "../utils/lines";
import {
    positionToRange,
    wordRangeToPosition as rangeToPosition,
} from "../utils/selectionsAndRanges";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";

type BlockIterationOptions = IterationOptions & {
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

function iterBlockStarts(
    document: vscode.TextDocument,
    options: BlockIterationOptions
): Linqish<vscode.Position> {
    return new Linqish(
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
                    "backwards"
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
): Linqish<vscode.Range> {
    return iterBlockStarts(document, {
        ...options,
        indentationLevel: "same-indentation",
    }).map((point) => getContainingBlock(document, positionToRange(point)));
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: IterationOptions
): Linqish<vscode.Range> {
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
): Linqish<vscode.Range> {
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

export function duplicate(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    object: vscode.Range
): vscode.Range {
    const startLine = document.lineAt(object.start.line);
    const endLine = document.lineAt(object.end.line);

    const linesToDuplicate = document.getText(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    textEdit.insert(startLine.range.start, linesToDuplicate);

    return object;
}

function deleteBlock(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    object: vscode.Range
) {
    const nextBlock = iterVertically(document, {
        startingPosition: object.end,
        direction: "forwards",
        restrictToCurrentScope: true,
    }).tryFirst();

    if (nextBlock) {
        textEdit.delete(new vscode.Range(object.start, nextBlock.start));

        return positionToRange(object.start);
    }

    const prevBlock = iterVertically(document, {
        startingPosition: object.start,
        direction: "backwards",
        restrictToCurrentScope: true,
    }).tryFirst();

    if (prevBlock) {
        textEdit.delete(new vscode.Range(prevBlock.end, object.end));

        return positionToRange(prevBlock.start);
    }

    textEdit.delete(object);

    return positionToRange(object.start);
}

export default class BlockIO extends SubjectIOBase {
    deletableSeparators = /.*/;

    getContainingObjectAt = getContainingRangeAt;
    getClosestObjectTo = getClosestContainingBlock;
    iterAll = iterAll;
    iterHorizontally = iterHorizontally;
    iterVertically = iterVertically;
    duplicate = duplicate;

    deleteObject = deleteBlock;
}
