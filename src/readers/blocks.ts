import * as vscode from "vscode";
import * as common from "../common";
import * as lines from "./lines";
import * as lineUtils from "../utils/lines";

type BlockBoundary = Readonly<{
    kind: "block-end" | "block-start";
    point: vscode.Position;
}>;

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
    options: {
        fromPosition: vscode.Position;
        direction?: common.Direction;
        indentationLevel?: common.IndentationRequest;
        currentInclusive?: boolean;
    }
): common.Linqish<vscode.Position> {
    return new common.Linqish(
        (function* () {
            const finalOptions: Required<typeof options> = {
                direction: "forwards",
                indentationLevel: "same-indentation",
                currentInclusive: false,
                ...options,
            };

            const documentLines = lineUtils.iterLinePairs(
                document,
                options.fromPosition.line,
                finalOptions.direction,
                { currentInclusive: finalOptions.currentInclusive }
            );

            for (const { prev, current } of documentLines) {
                let candidateLine: vscode.TextLine | undefined;
                let kind: BlockBoundary["kind"] | undefined;

                if (current && lineIsBlockStart(prev, current)) {
                    candidateLine = current;
                    kind = "block-start";
                } else if (prev && lineIsBlockEnd(prev, current)) {
                    candidateLine = prev;
                    kind = "block-end";
                }

                if (candidateLine && kind) {
                    const relativeIndentation =
                        lineUtils.getRelativeIndentation(
                            document.lineAt(options.fromPosition.line),
                            candidateLine
                        );

                    if (
                        finalOptions.indentationLevel ===
                            "same-indentation-current-scope" &&
                        relativeIndentation === "less-indentation"
                    ) {
                        return;
                    }

                    if (
                        finalOptions.indentationLevel === "any-indentation" ||
                        relativeIndentation === finalOptions.indentationLevel
                    ) {
                        switch (kind) {
                            case "block-start":
                                const point = new vscode.Position(
                                    candidateLine.lineNumber,
                                    candidateLine.firstNonWhitespaceCharacterIndex
                                );

                                yield { kind, point };
                                break;
                            case "block-end":
                                yield {
                                    kind: kind,
                                    point: candidateLine.range.end,
                                };
                                break;
                        }
                    }
                }
            }

            if (finalOptions.direction === "backwards") {
                yield {
                    kind: "block-start",
                    point: new vscode.Position(0, 0),
                };
            }
        })()
    );
}

export function iterBlocksInCurrentScope(
    document: vscode.TextDocument,
    options: {
        fromPosition: vscode.Position;
        direction?: common.Direction;
    }
): common.Linqish<vscode.Range> {
    return new common.Linqish(
        (function* () {
            const boundaries = iterBlockBoundaries(document, {
                indentationLevel: "same-indentation-current-scope",
                ...options,
            });

            let currentlyOpenBlock: BlockBoundary | undefined = undefined;

            for (const boundary of boundaries) {
                if (boundary.point.isEqual(options.fromPosition)) {
                    continue;
                }

                if (!currentlyOpenBlock) {
                    if (
                        boundary.kind ===
                        (options.direction === "forwards"
                            ? "block-start"
                            : "block-end")
                    ) {
                        currentlyOpenBlock = boundary;
                        continue;
                    } else {
                        return;
                    }
                }

                yield new vscode.Range(
                    currentlyOpenBlock.point,
                    boundary.point
                );

                currentlyOpenBlock = undefined;
            }
        })()
    );
}

function findContainingBlockStart(
    document: vscode.TextDocument,
    positionInBlock: vscode.Position
): vscode.TextLine {
    return (
        lineUtils
            .iterLinePairs(
                document,
                positionInBlock.line,
                common.Direction.backwards,
                { currentInclusive: true }
            )
            .filterMap(({ prev, current }) => {
                if (current && lineIsBlockStart(prev, current)) {
                    return current;
                }
            })
            .tryFirst() ?? document.lineAt(0)
    );
}

function findCorrespondingBlockEnd(
    document: vscode.TextDocument,
    blockStart: vscode.Position
): vscode.Position {
    let startingLine = document.lineAt(blockStart.line);
    let candidate = startingLine;

    for (const { prev, current } of lineUtils.iterLinePairs(
        document,
        blockStart.line,
        "forwards",
        { currentInclusive: true }
    )) {
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
    positionInBlock: vscode.Position
): vscode.Range {
    const blockStart = findContainingBlockStart(document, positionInBlock);
    const blockEnd = findCorrespondingBlockEnd(
        document,
        blockStart.range.start
    );

    return new vscode.Range(blockStart.range.start, blockEnd);
}

function iterVertically(
    document: vscode.TextDocument,
    fromPosition: vscode.Position,
    direction: common.Direction
): common.Linqish<vscode.Range> {
    return iterBlockBoundaries(document, {
        fromPosition: fromPosition,
        direction: direction,
        indentationLevel: "same-indentation",
    }).filterMap(({ kind, point }) => {
        if (kind === "block-start") {
            return getContainingBlock(document, point);
        }
    });
}

function iterHorizontally(
    document: vscode.TextDocument,
    fromPosition: vscode.Position,
    direction: common.Direction
): common.Linqish<vscode.Range> {
    const indentation =
        direction === common.Direction.forwards
            ? "more-indentation"
            : "less-indentation";

    return iterBlockBoundaries(document, {
        fromPosition,
        direction,
        indentationLevel: indentation,
        currentInclusive: false,
    }).filterMap(({ kind, point }) => {
        if (kind === "block-start") {
            return getContainingBlock(document, point);
        }
    });
}

function iterAll(
    document: vscode.TextDocument,
    fromPosition: vscode.Position,
    direction: common.Direction
): common.Linqish<vscode.Range> {
    const finalOptions = {
        fromPosition,
        direction,
        indentationLevel: "any-indentation",
    } as const;

    return iterBlockBoundaries(document, finalOptions).filterMap(
        ({ kind, point }) => {
            if (kind === "block-start") {
                return getContainingBlock(document, point);
            }
        }
    );
}

function search(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    targetChar: common.Char,
    direction: common.Direction
): vscode.Range | undefined {
    const blockPoints = iterAll(document, startingPosition, direction);

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

    return getContainingBlock(document, startingPosition);
}

function getClosestContainingBlock(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    const nearestLine = lineUtils.getNearestSignificantLine(document, position);

    return getContainingBlock(document, nearestLine.range.start);
}

const reader: common.SubjectReader = {
    getContainingRangeAt: getContainingBlock,
    getClosestRangeTo: getClosestContainingBlock,
    iterAll,
    iterHorizontally,
    iterVertically,
    search,
};

export default reader;
