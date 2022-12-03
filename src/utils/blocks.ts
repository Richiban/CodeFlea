import * as vscode from "vscode";
import * as common from "../common";
import * as lines from "./lines";

type Bounds = { start: { line: number }; end: { line: number } };

export type BlockBoundary = Readonly<{
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
    if (lines.lineIsStopLine(currentLine)) {
        return false;
    }
    if (lines.lineIsStopLine(prevLine)) {
        return true;
    }
    if (
        lines.getRelativeIndentation(prevLine, currentLine) ===
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
    if (lines.lineIsStopLine(nextLine)) {
        return true;
    }
    if (
        lines.getRelativeIndentation(currentLine, nextLine) ===
        "less-indentation"
    ) {
        return true;
    }

    return false;
}

function iterBlockBoundaries(
    editor: vscode.TextEditor,
    options: {
        fromPosition: vscode.Position;
        direction?: common.Direction;
        indentationLevel?: common.IndentationRequest;
    }
): common.Linqish<BlockBoundary> {
    return new common.Linqish(
        (function* () {
            const finalOptions: Required<typeof options> = {
                direction: "forwards",
                indentationLevel: "same-indentation",
                ...options,
            };

            const documentLines = lines.iterLinePairs(
                editor.document,
                options.fromPosition.line,
                finalOptions.direction
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
                    const relativeIndentation = lines.getRelativeIndentation(
                        editor.document.lineAt(options.fromPosition.line),
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
    editor: vscode.TextEditor,
    options: {
        fromPosition: vscode.Position;
        direction?: common.Direction;
    }
): common.Linqish<vscode.Range> {
    return new common.Linqish(
        (function* () {
            const boundaries = iterBlockBoundaries(editor, {
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
    editor: vscode.TextEditor,
    positionInBlock: vscode.Position
): vscode.TextLine {
    for (const { prev, current } of lines.iterLinePairs(
        editor.document,
        positionInBlock.line,
        "backwards"
    )) {
        if (!current) {
            continue;
        }

        if (lineIsBlockStart(prev, current)) {
            return current;
        }
    }

    return editor.document.lineAt(0);
}

function findCorrespondingBlockEnd(
    editor: vscode.TextEditor,
    blockStart: vscode.Position
): vscode.Position {
    let startingLine = editor.document.lineAt(blockStart.line);
    let candidate = startingLine;

    for (const { prev, current } of lines.iterLinePairs(
        editor.document,
        blockStart.line,
        "forwards"
    )) {
        if (!current || !prev) {
            break;
        }

        const relativeIndentation = lines.getRelativeIndentation(
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

export function getContainingBlock(
    editor: vscode.TextEditor,
    positionInBlock: vscode.Position
): vscode.Range {
    const blockStart = findContainingBlockStart(editor, positionInBlock);
    const blockEnd = findCorrespondingBlockEnd(editor, blockStart.range.start);

    return new vscode.Range(blockStart.range.start, blockEnd);
}

export function duplicate(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    block: vscode.Range
) {
    const startLine = document.lineAt(block.start.line);
    const endLine = document.lineAt(block.end.line);

    const linesToDuplicate = document.getText(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    textEdit.insert(startLine.range.start, linesToDuplicate);
}

export function iterVertically(
    editor: vscode.TextEditor,
    options: {
        fromPosition: vscode.Position;
        direction: common.Direction;
    }
): common.Linqish<vscode.Range> {
    return iterBlockBoundaries(editor, {
        ...options,
        indentationLevel: "same-indentation",
    }).filterMap(({ kind, point }) => {
        if (kind === "block-start") {
            return getContainingBlock(editor, point);
        }
    });
}

export function iterHorizontally(
    editor: vscode.TextEditor,
    options: {
        fromPosition: vscode.Position;
        direction: common.Direction;
    }
): common.Linqish<vscode.Range> {
    const indentation =
        options.direction === "backwards"
            ? "less-indentation"
            : "more-indentation";

    return iterBlockBoundaries(editor, {
        ...options,
        indentationLevel: indentation,
    }).filterMap(({ kind, point }) => {
        if (kind === "block-start") {
            return getContainingBlock(editor, point);
        }
    });
}

export function iterAll(
    editor: vscode.TextEditor,
    options: {
        fromPosition: vscode.Position;
        direction: common.Direction;
    }
): common.Linqish<vscode.Range> {
    const finalOptions = {
        ...options,
        indentationLevel: "any-indentation",
    } as const;

    return iterBlockBoundaries(editor, finalOptions).filterMap(
        ({ kind, point }) => {
            if (kind === "block-start") {
                return getContainingBlock(editor, point);
            }
        }
    );
}
