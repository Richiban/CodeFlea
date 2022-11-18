import * as blocks from "../utils/blocks";
import * as positions from "../utils/positions";
import * as vscode from "vscode";
import * as lines from "../utils/lines";
import * as words from "../utils/words";
import * as selections from "../utils/selectionsAndRanges";
import * as editor from "../utils/editor";
import * as common from "../common";

export type SubjectType = "WORD" | "LINE" | "SUBWORD" | "ALL_LINES" | "BLOCK";

export type SubjectActions = {
    nextSubjectDown(): Promise<void>;
    nextSubjectUp(): Promise<void>;
    nextSubjectLeft(): Promise<void>;
    nextSubjectRight(): Promise<void>;

    addSubjectDown(): Promise<void>;
    addSubjectUp(): Promise<void>;
    addSubjectLeft(): Promise<void>;
    addSubjectRight(): Promise<void>;

    extendSubjectDown(): Promise<void>;
    extendSubjectUp(): Promise<void>;
    extendSubjectLeft(): Promise<void>;
    extendSubjectRight(): Promise<void>;

    swapSubjectDown(): Promise<void>;
    swapSubjectUp(): Promise<void>;
    swapSubjectLeft(): Promise<void>;
    swapSubjectRight(): Promise<void>;

    nextSubjectMatch(): Promise<void>;
    prevSubjectMatch(): Promise<void>;
    extendNextSubjectMatch(): Promise<void>;
    extendPrevSubjectMatch(): Promise<void>;

    firstSubjectInScope(): Promise<void>;
    lastSubjectInScope(): Promise<void>;

    deleteSubject(): Promise<void>;
    changeSubject(): Promise<void>;

    append(): Promise<void>;
    prepend(): Promise<void>;

    newLineAbove(): Promise<void>;
    newLineBelow(): Promise<void>;

    search(target: string): Promise<void>;
    searchBackwards(target: string): Promise<void>;
};

export abstract class Subject implements SubjectActions, vscode.Disposable {
    constructor(protected context: common.ExtensionContext) {}

    dispose() {}

    async nextSubjectDown() {}
    async nextSubjectUp() {}
    async nextSubjectLeft() {}
    async nextSubjectRight() {}
    async addSubjectDown() {}
    async addSubjectUp() {}
    async addSubjectLeft() {}
    async addSubjectRight() {}

    async extendSubjectUp(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectUp();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectDown() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectDown();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectLeft(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectLeft();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectRight() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectRight();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async swapSubjectDown() {}
    async swapSubjectUp() {}
    async swapSubjectLeft() {}
    async swapSubjectRight() {}
    async deleteSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }
    async firstSubjectInScope() {}
    async lastSubjectInScope() {}
    async search(target: string) {}
    async searchBackwards(target: string) {}

    async nextSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.moveSelectionToNextFindMatch"
        );
    }

    async prevSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.moveSelectionToPreviousFindMatch"
        );
    }

    async extendPrevSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.addSelectionToPreviousFindMatch"
        );
    }

    async extendNextSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.addSelectionToNextFindMatch"
        );
    }

    async append() {
        selections.collapseSelections(this.context.editor, "end");
    }

    async prepend() {
        selections.collapseSelections(this.context.editor, "start");
    }

    async newLineAbove() {
        await vscode.commands.executeCommand("editor.action.insertLineBefore");
    }

    async newLineBelow() {
        await vscode.commands.executeCommand("editor.action.insertLineAfter");
    }

    abstract name: SubjectType;
    abstract fixSelection(): Promise<void>;
    abstract clearUI(): void;

    equals(other: Subject) {
        return this.name === other.name;
    }
}

export function createFrom(
    context: common.ExtensionContext,
    subjectName: SubjectType
): Subject {
    switch (subjectName) {
        case "LINE":
            return new LineSubject(context);
        case "WORD":
            return new WordSubject(context);
        case "ALL_LINES":
            return new AllLinesSubject(context);
        case "SUBWORD":
            return new SubWordSubject(context);
        case "BLOCK":
            return new BlockSubject(context);
    }
}
export class AllLinesSubject extends Subject {
    readonly name = "ALL_LINES";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px dashed #8feb34;",
        }
    );

    clearUI() {
        this.context.editor.setDecorations(AllLinesSubject.decorationType, []);
    }

    async fixSelection() {
        selections.map(this.context.editor, (selection) => {
            const startLine = this.context.editor.document.lineAt(
                selection.start.line
            );
            const endLine = this.context.editor.document.lineAt(
                selection.end.line
            );

            return new vscode.Selection(
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                ),
                endLine.range.end
            );
        });

        this.context.editor.setDecorations(
            AllLinesSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
        this.fixSelection();
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
        this.fixSelection();
    }

    async extendSubjectDown() {
        await vscode.commands.executeCommand("editor.action.insertCursorBelow");
        this.fixSelection();
    }

    async extendSubjectUp() {
        await vscode.commands.executeCommand("editor.action.insertCursorAbove");
        this.fixSelection();
    }

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
        this.fixSelection();
    }
}

export class BlockSubject extends Subject {
    readonly name = "BLOCK";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #aba246;",
        }
    );

    clearUI() {
        this.context.editor.setDecorations(BlockSubject.decorationType, []);
    }

    async fixSelection() {
        selections.map(this.context.editor, (selection) => {
            const startBlock = blocks.getContainingBlock(selection.start);
            const endBlock = blocks.getContainingBlock(selection.end);

            return new vscode.Selection(
                new vscode.Position(endBlock.end.line, endBlock.end.character),
                new vscode.Position(
                    startBlock.start.line,
                    startBlock.start.character
                )
            );
        });

        this.context.editor.setDecorations(
            BlockSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectDown() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("forwards", "same-indentation", from);

        this.fixSelection();
    }

    async nextSubjectUp() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("backwards", "same-indentation", from);

        this.fixSelection();
    }

    async nextSubjectLeft() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("backwards", "less-indentation", from);

        this.fixSelection();
    }

    async nextSubjectRight() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("forwards", "more-indentation", from);

        this.fixSelection();
    }

    async swapSubjectDown() {
        this.context.editor.edit((e) => {
            selections.map(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const nextBlock = blocks.getNextBlockInScope(
                    selection.end,
                    "forwards"
                );

                if (!nextBlock) {
                    return selection;
                }

                editor.swap(
                    this.context.editor.document,
                    e,
                    thisBlock,
                    nextBlock
                );

                return new vscode.Selection(nextBlock.end, nextBlock.start);
            });
        });
    }

    async swapSubjectLeft() {
        this.context.editor.edit((textEdit) => {
            selections.map(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const targetBlock = blocks
                    .iterBlockBoundaries({
                        fromPosition: selection.start,
                        direction: "backwards",
                        indentationLevel: "less-indentation",
                    })
                    .filter((b) => b.kind === "block-start")
                    .tryFirst();

                if (!targetBlock) {
                    return selection;
                }

                const toMove = thisBlock.with({
                    end: new vscode.Position(thisBlock.end.line + 1, 0),
                });

                editor.move(
                    this.context.editor.document,
                    textEdit,
                    toMove,
                    targetBlock.point
                );

                //return selection;
                return new vscode.Selection(thisBlock.start, thisBlock.start);
            });
        });

        this.fixSelection();
    }

    async swapSubjectUp() {
        this.context.editor.edit((e) => {
            selections.map(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const nextBlock = blocks.getNextBlockInScope(
                    selection.start,
                    "backwards"
                );

                if (!nextBlock) {
                    return selection;
                }

                editor.swap(
                    this.context.editor.document,
                    e,
                    thisBlock,
                    nextBlock
                );

                return new vscode.Selection(nextBlock.end, nextBlock.start);
            });
        });
    }

    async extendSubjectUp(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectUp();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectDown() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectDown();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async firstSubjectInScope() {
        selections.map(this.context.editor, (selection) => {
            const newBlock = blocks.getFirstLastBlockInScope(
                selection.start,
                "backwards"
            );

            if (newBlock) {
                return new vscode.Selection(newBlock.start, newBlock.end);
            } else {
                return selection;
            }
        });

        this.fixSelection();
    }

    async lastSubjectInScope() {
        selections.map(this.context.editor, (selection) => {
            const newBlock = blocks.getFirstLastBlockInScope(
                selection.start,
                "forwards"
            );

            if (newBlock) {
                return new vscode.Selection(newBlock.start, newBlock.end);
            } else {
                return selection;
            }
        });

        this.fixSelection();
    }

    async deleteSubject() {
        for (const selection of this.context.editor.selections) {
            const prevBlock = blocks.getNextBlockInScope(
                selection.start,
                "backwards"
            );

            if (prevBlock) {
                this.context.editor.edit((e) => {
                    e.delete(new vscode.Range(prevBlock.end, selection.end));
                });
            } else {
                const nextBlock = blocks.getNextBlockInScope(
                    selection.end,
                    "forwards"
                );

                if (nextBlock) {
                    this.context.editor.edit((e) => {
                        e.delete(
                            new vscode.Range(selection.start, nextBlock.start)
                        );
                    });
                }
            }
        }
    }

    async search(target: common.Char) {
        selections.map(this.context.editor, (selection) => {
            const blockPoints = new common.Linqish(
                blocks.iterBlockBoundaries({
                    fromPosition: selection.end,
                })
            ).filter(({ kind }) => kind === "block-start");

            for (const { point } of blockPoints) {
                const charRange = new vscode.Range(
                    point,
                    point.translate(undefined, 1)
                );

                const char = this.context.editor.document.getText(charRange);

                if (char === target) {
                    return new vscode.Selection(charRange.end, charRange.start);
                }
            }

            return selection;
        });

        this.fixSelection();
    }

    async searchBackwards(target: common.Char) {
        selections.map(this.context.editor, (selection) => {
            const blockPoints = new common.Linqish(
                blocks.iterBlockBoundaries({
                    fromPosition: selection.end,
                    direction: "backwards",
                })
            ).filter(({ kind }) => kind === "block-start");

            for (const { point } of blockPoints) {
                const charRange = new vscode.Range(
                    point,
                    point.translate(undefined, 1)
                );

                const char = this.context.editor.document.getText(charRange);

                if (char === target) {
                    return new vscode.Selection(charRange.end, charRange.start);
                }
            }

            return selection;
        });

        this.fixSelection();
    }
}

export class LineSubject extends Subject {
    readonly name = "LINE";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #8feb34;",
        }
    );

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
        this.fixSelection();
    }

    clearUI() {
        this.context.editor.setDecorations(LineSubject.decorationType, []);
    }

    async fixSelection() {
        selections.map(this.context.editor, (selection) => {
            const startLine = this.context.editor.document.lineAt(
                selection.start.line
            );
            const endLine = this.context.editor.document.lineAt(
                selection.end.line
            );

            return new vscode.Selection(
                endLine.range.end,
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                )
            );
        });

        this.context.editor.setDecorations(
            LineSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");

        while (
            this.context.editor.selections.reduce(
                (state, selection) =>
                    state &&
                    selection.isSingleLine &&
                    selection.start.line <
                        this.context.editor.document.lineCount - 1 &&
                    lines.lineIsStopLine(
                        this.context.editor.document.lineAt(
                            selection.start.line
                        )
                    ),
                true
            )
        ) {
            await vscode.commands.executeCommand("cursorDown");
        }

        this.fixSelection();
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");

        while (
            this.context.editor.selections.reduce(
                (state, selection) =>
                    state &&
                    selection.isSingleLine &&
                    selection.start.line > 0 &&
                    lines.lineIsStopLine(
                        this.context.editor.document.lineAt(
                            selection.start.line
                        )
                    ),
                true
            )
        ) {
            await vscode.commands.executeCommand("cursorUp");
        }

        this.fixSelection();
    }

    async nextSubjectLeft() {
        selections.map(this.context.editor, (selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            const nextLine = lines.getNextLineOfChangeOfIndentation(
                "lessThan",
                "backwards",
                this.context.editor.document,
                this.context.editor.document.lineAt(selection.start.line)
            );

            if (nextLine) {
                return new vscode.Selection(
                    nextLine.range.end,
                    nextLine.range.start
                );
            }

            return selection;
        });
    }

    async nextSubjectRight() {
        selections.map(this.context.editor, (selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            const nextLine = lines.getNextLineOfChangeOfIndentation(
                "greaterThan",
                "forwards",
                this.context.editor.document,
                this.context.editor.document.lineAt(selection.start.line)
            );

            if (nextLine) {
                return new vscode.Selection(
                    nextLine.range.end,
                    nextLine.range.start
                );
            }

            return selection;
        });
    }

    async swapSubjectLeft() {
        this.context.editor.edit((e) => {
            selections.map(this.context.editor, (selection) => {
                if (!selection.isSingleLine) {
                    return selection;
                }

                const targetLine = lines.getNextLineOfChangeOfIndentation(
                    "lessThan",
                    "backwards",
                    this.context.editor.document,
                    this.context.editor.document.lineAt(selection.start.line)
                );

                if (targetLine) {
                    const sourceLineRange = this.context.editor.document.lineAt(
                        selection.start.line
                    ).rangeIncludingLineBreak;

                    e.insert(
                        targetLine.range.start,
                        this.context.editor.document.getText(sourceLineRange)
                    );

                    e.delete(sourceLineRange);
                }

                return selection;
            });
        });
    }
    async swapSubjectRight() {
        this.context.editor.edit((e) => {
            selections.map(this.context.editor, (selection) => {
                if (!selection.isSingleLine) {
                    return selection;
                }

                const targetLine = lines.getNextLineOfChangeOfIndentation(
                    "greaterThan",
                    "forwards",
                    this.context.editor.document,
                    this.context.editor.document.lineAt(selection.start.line)
                );

                if (targetLine) {
                    const originalText =
                        this.context.editor.document.getText(selection);
                    const targetText = this.context.editor.document.getText(
                        targetLine.range
                    );

                    e.replace(targetLine.range, originalText);
                    e.replace(selection, targetText);

                    return new vscode.Selection(
                        targetLine.range.end,
                        targetLine.range.start
                    );
                }

                return selection;
            });
        });
    }

    async swapSubjectDown() {
        await vscode.commands.executeCommand(
            "editor.action.moveLinesDownAction"
        );
    }

    async swapSubjectUp() {
        await vscode.commands.executeCommand("editor.action.moveLinesUpAction");
    }

    async search(target: common.Char) {
        selections.map(this.context.editor, (selection) => {
            for (const line of lines
                .iterLines(
                    this.context.editor.document,
                    selection.start.line,
                    "forwards"
                )
                .skip(1)) {
                const char = this.context.editor.document.getText(line.range)[
                    line.firstNonWhitespaceCharacterIndex
                ];

                if (char === target) {
                    return new vscode.Selection(
                        line.range.end,
                        line.range.start
                    );
                }
            }

            return selection;
        });

        this.fixSelection();
    }

    async searchBackwards(target: common.Char) {
        selections.map(this.context.editor, (selection) => {
            for (const line of lines
                .iterLines(
                    this.context.editor.document,
                    selection.start.line,
                    "backwards"
                )
                .skip(1)) {
                const char = this.context.editor.document.getText(line.range)[
                    line.firstNonWhitespaceCharacterIndex
                ];

                if (char === target) {
                    return new vscode.Selection(
                        line.range.end,
                        line.range.start
                    );
                }
            }

            return selection;
        });

        this.fixSelection();
    }
}

export class SubWordSubject extends Subject {
    readonly name = "SUBWORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "2px dotted #964d4d;",
        }
    );

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async nextSubjectLeft() {
        selections.map(this.context.editor, (selection) => {
            return new vscode.Selection(
                positions.translateWithWrap(
                    this.context.editor.document,
                    selection.start,
                    -1
                ),
                positions.translateWithWrap(
                    this.context.editor.document,
                    selection.start,
                    -1
                )
            );
        });

        this.fixSelection();
    }

    async nextSubjectRight() {
        selections.map(this.context.editor, (selection) => {
            return new vscode.Selection(
                positions.translateWithWrap(
                    this.context.editor.document,
                    selection.end,
                    0
                ),
                positions.translateWithWrap(
                    this.context.editor.document,
                    selection.end,
                    0
                )
            );
        });

        this.fixSelection();
    }

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
    }

    async fixSelection() {
        if (!this.context.editor) {
            return;
        }

        selections.map(this.context.editor, (selection) => {
            const wordRange = words.expandSelectionToSubwords(
                this.context.editor.document,
                selection
            );

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        this.context.editor.setDecorations(
            SubWordSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    clearUI(): void {
        this.context.editor.setDecorations(SubWordSubject.decorationType, []);
    }
}

export class WordSubject extends Subject {
    readonly name = "WORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #964d4d;",
        }
    );

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    clearUI(): void {
        this.context.editor.setDecorations(WordSubject.decorationType, []);
    }

    async fixSelection() {
        if (!this.context.editor) {
            return;
        }

        selections.map(this.context.editor, (selection) => {
            const wordRange = words.expandSelectionToWords(
                this.context.editor.document,
                selection
            );

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        this.context.editor.setDecorations(
            WordSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectDown() {
        selections.map(this.context.editor, (selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            return (
                words.nextWordUpDown(
                    this.context.editor.document,
                    selection.active,
                    "down"
                ) ?? selection
            );
        });

        this.fixSelection();
    }

    async nextSubjectUp() {
        selections.map(this.context.editor, (selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            return (
                words.nextWordUpDown(
                    this.context.editor.document,
                    selection.active,
                    "up"
                ) ?? selection
            );
        });

        this.fixSelection();
    }

    async nextSubjectLeft() {
        selections.map(this.context.editor, (selection) => {
            const wordRange = words.nextWord(
                this.context.editor.document,
                selection.start,
                "backwards"
            );

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        this.fixSelection();
    }

    async nextSubjectRight() {
        selections.map(this.context.editor, (selection) => {
            const wordRange = words.nextWord(
                this.context.editor.document,
                selection.end,
                "forwards"
            );

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        this.fixSelection();
    }

    async swapSubjectLeft() {
        await words.swapWordsWithNeighbors(this.context.editor, "backwards");
    }

    async swapSubjectRight() {
        await words.swapWordsWithNeighbors(this.context.editor, "forwards");
    }

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
    }

    async deleteSubject() {
        for (const selection of this.context.editor.selections) {
            await this.context.editor.edit((e) => {
                words.deleteWord(this.context.editor, e, selection);
            });

            if (
                this.context.editor.document.lineAt(selection.active.line)
                    .isEmptyOrWhitespace
            ) {
                await vscode.commands.executeCommand(
                    "editor.action.deleteLines"
                );
            }
        }

        await this.fixSelection();
    }

    async search(target: common.Char) {
        selections.map(this.context.editor, (selection) => {
            const searchResult = words.search(
                this.context.editor,
                selection.end,
                target,
                "forwards"
            );

            if (searchResult) {
                return new vscode.Selection(
                    searchResult.end,
                    searchResult.start
                );
            }

            return selection;
        });

        this.fixSelection();
    }

    async searchBackwards(target: common.Char) {
        selections.map(this.context.editor, (selection) => {
            const searchResult = words.search(
                this.context.editor,
                selection.start,
                target,
                "backwards"
            );

            if (searchResult) {
                return new vscode.Selection(
                    searchResult.end,
                    searchResult.start
                );
            }

            return selection;
        });

        this.fixSelection();
    }
}
