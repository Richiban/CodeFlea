import ModeManager from "../modes/ModeManager";
import * as blocks from "../utils/blocks";
import * as vscode from "vscode";
import * as lines from "../utils/lines";
import * as words from "../utils/words";
import * as selections from "../utils/selections";
import * as positions from "../utils/positions";
import { Char } from "../common";
import { swap } from "../utils/editor";

export type SubjectType =
    | "WORD"
    | "LINE"
    | "SMALL_WORD"
    | "ALL_LINES"
    | "BLOCK";

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

    firstSubjectInLine(): Promise<void>;
    lastSubjectInLine(): Promise<void>;

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
    public abstract decorationType: vscode.TextEditorDecorationType;

    constructor(protected readonly editor: vscode.TextEditor) {}

    dispose() {
        if (this.editor) {
            this.editor.setDecorations(this.decorationType, []);
        }
    }

    async nextSubjectDown() {}
    async nextSubjectUp() {}
    async nextSubjectLeft() {}
    async nextSubjectRight() {}
    async addSubjectDown() {}
    async addSubjectUp() {}
    async addSubjectLeft() {}
    async addSubjectRight() {}
    async extendSubjectDown() {}
    async extendSubjectUp() {}
    async extendSubjectLeft() {}
    async extendSubjectRight() {}
    async swapSubjectDown() {}
    async swapSubjectUp() {}
    async swapSubjectLeft() {}
    async swapSubjectRight() {}
    async deleteSubject() {}
    async changeSubject() {}
    async firstSubjectInLine() {}
    async lastSubjectInLine() {}
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
        selections.collapseSelections(this.editor, "end");
    }

    async prepend() {
        selections.collapseSelections(this.editor, "start");
    }

    async newLineAbove() {
        await vscode.commands.executeCommand("editor.action.insertLineBefore");
    }

    async newLineBelow() {
        await vscode.commands.executeCommand("editor.action.insertLineAfter");
    }

    abstract name: SubjectType;
    abstract fixSelection(): Promise<void>;

    equals(other: Subject) {
        return this.name === other.name;
    }
}

export function createFrom(
    manager: ModeManager,
    subjectName: SubjectType
): Subject {
    switch (subjectName) {
        case "LINE":
            return new LineSubject(manager.editor!);
        case "WORD":
            return new WordSubject(manager.editor!);
        case "ALL_LINES":
            return new AllLinesSubject(manager.editor!);
        case "SMALL_WORD":
            return new SmallWordSubject(manager.editor!);
        case "BLOCK":
            return new BlockSubject(manager.editor!);
    }
}
export class AllLinesSubject extends Subject {
    readonly name = "ALL_LINES";

    public decorationType = vscode.window.createTextEditorDecorationType({
        border: "1px dashed #964d4d;",
        fontWeight: "bold",
    });

    async fixSelection() {
        this.editor.selections = this.editor.selections.map((selection) => {
            const startLine = this.editor.document.lineAt(selection.start.line);
            const endLine = this.editor.document.lineAt(selection.end.line);

            return new vscode.Selection(
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                ),
                endLine.range.end
            );
        });
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
        this.fixSelection();
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
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

    public decorationType = vscode.window.createTextEditorDecorationType({
        border: "1px solid #aba246;",
        fontWeight: "bold",
    });

    async fixSelection() {
        this.editor.selections = this.editor.selections.map((selection) => {
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

        this.editor.setDecorations(this.decorationType, this.editor.selections);
    }

    async nextSubjectDown() {
        const from = this.editor?.selection.start;

        blocks.moveToNextBlockStart("forwards", "same-indentation", from);

        this.fixSelection();
    }

    async nextSubjectUp() {
        const from = this.editor?.selection.start;

        blocks.moveToNextBlockStart("backwards", "same-indentation", from);

        this.fixSelection();
    }

    async nextSubjectLeft() {
        const from = this.editor?.selection.start;

        blocks.moveToNextBlockStart("backwards", "less-indentation", from);

        this.fixSelection();
    }

    async nextSubjectRight() {
        const from = this.editor?.selection.start;

        blocks.moveToNextBlockStart("forwards", "more-indentation", from);

        this.fixSelection();
    }

    async swapSubjectDown() {
        this.editor.edit((e) => {
            selections.map(this.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const nextBlock = blocks.getNextBlock(selection.end);

                if (!nextBlock) {
                    return selection;
                }

                swap(this.editor.document, e, thisBlock, nextBlock);

                return new vscode.Selection(nextBlock.end, nextBlock.start);
            });
        });
    }

    async swapSubjectUp() {
        this.editor.edit((e) => {
            selections.map(this.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const nextBlock = blocks.getPrevBlock(selection.start);

                if (!nextBlock) {
                    return selection;
                }

                swap(this.editor.document, e, thisBlock, nextBlock);

                return new vscode.Selection(nextBlock.end, nextBlock.start);
            });
        });
    }

    async deleteSubject() {
        for (const selection of this.editor.selections) {
            const line = this.editor.document.lineAt(selection.start.line);

            const prevBlock = blocks.getPrevBlock(selection.start);

            if (prevBlock) {
                this.editor.edit((e) => {
                    e.delete(new vscode.Range(prevBlock.end, selection.end));
                });
            } else {
                const nextBlock = blocks.getNextBlock(selection.end);

                if (nextBlock) {
                    this.editor.edit((e) => {
                        e.delete(
                            new vscode.Range(selection.start, nextBlock.start)
                        );
                    });
                }
            }
        }
    }
}

export class LineSubject extends Subject {
    readonly name = "LINE";

    public decorationType = vscode.window.createTextEditorDecorationType({
        border: "#8feb34;",
        fontWeight: "bold",
    });

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
        this.fixSelection();
    }

    async fixSelection() {
        selections.map(this.editor, (selection) => {
            const startLine = this.editor.document.lineAt(selection.start.line);
            const endLine = this.editor.document.lineAt(selection.end.line);

            return new vscode.Selection(
                endLine.range.end,
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                )
            );
        });

        this.editor.setDecorations(this.decorationType, this.editor.selections);
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");

        while (
            this.editor.selections.reduce(
                (state, selection) =>
                    state &&
                    selection.isSingleLine &&
                    selection.start.line < this.editor.document.lineCount - 1 &&
                    lines.lineIsStopLine(
                        this.editor.document.lineAt(selection.start.line)
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
            this.editor.selections.reduce(
                (state, selection) =>
                    state &&
                    selection.isSingleLine &&
                    selection.start.line > 0 &&
                    lines.lineIsStopLine(
                        this.editor.document.lineAt(selection.start.line)
                    ),
                true
            )
        ) {
            await vscode.commands.executeCommand("cursorUp");
        }

        this.fixSelection();
    }

    async nextSubjectLeft() {
        const editor = this.editor;

        this.editor.selections = this.editor.selections.map((selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            const nextLine = lines.getNextLineOfChangeOfIndentation(
                "lessThan",
                "backwards",
                editor.document,
                editor.document.lineAt(selection.start.line)
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
        const editor = this.editor;

        this.editor.selections = this.editor.selections.map((selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            const nextLine = lines.getNextLineOfChangeOfIndentation(
                "greaterThan",
                "forwards",
                editor.document,
                editor.document.lineAt(selection.start.line)
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
        const editor = this.editor;

        editor.edit((e) => {
            selections.map(editor, (selection) => {
                if (!selection.isSingleLine) {
                    return selection;
                }

                const targetLine = lines.getNextLineOfChangeOfIndentation(
                    "lessThan",
                    "backwards",
                    editor.document,
                    editor.document.lineAt(selection.start.line)
                );

                if (targetLine) {
                    const sourceLineRange = editor.document.lineAt(
                        selection.start.line
                    ).rangeIncludingLineBreak;

                    e.insert(
                        targetLine.range.start,
                        editor.document.getText(sourceLineRange)
                    );

                    e.delete(sourceLineRange);
                }

                return selection;
            });
        });
    }
    async swapSubjectRight() {
        const editor = this.editor;

        editor.edit((e) => {
            selections.map(editor, (selection) => {
                if (!selection.isSingleLine) {
                    return selection;
                }

                const targetLine = lines.getNextLineOfChangeOfIndentation(
                    "greaterThan",
                    "forwards",
                    editor.document,
                    editor.document.lineAt(selection.start.line)
                );

                if (targetLine) {
                    const originalText = editor.document.getText(selection);
                    const targetText = editor.document.getText(
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
}

export class SmallWordSubject extends Subject {
    readonly name = "SMALL_WORD";

    public decorationType = vscode.window.createTextEditorDecorationType({
        border: "1px dashed #964d4d;",
        fontWeight: "bold",
    });

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async nextSubjectLeft() {
        await vscode.commands.executeCommand("cursorWordPartLeft");
        await vscode.commands.executeCommand("cursorLeft");
    }

    async nextSubjectRight() {
        await vscode.commands.executeCommand("cursorWordPartRight");
    }

    async fixSelection() {
        await vscode.commands.executeCommand(
            "editor.action.smartSelect.expand"
        );
    }
}

export class WordSubject extends Subject {
    readonly name = "WORD";

    public decorationType = vscode.window.createTextEditorDecorationType({
        border: "1px dashed #964d4d;",
        fontWeight: "bold",
    });

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async fixSelection() {
        const editor = this.editor;

        if (!editor) {
            return;
        }

        editor.selections = editor.selections.map((selection) => {
            const wordRange = words.expandSelectionToWords(
                editor.document,
                selection
            );

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        editor.setDecorations(this.decorationType, editor.selections);
    }

    async nextSubjectDown() {
        const editor = this.editor;

        editor.selections = editor.selections.map((selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            const nextLine = lines.getNextSignificantLine(
                editor.document,
                selection.end,
                "forwards"
            );

            if (nextLine) {
                return new vscode.Selection(
                    selection.start.with(nextLine.lineNumber),
                    selection.start.with(nextLine.lineNumber)
                );
            }

            return selection;
        });

        this.fixSelection();
    }

    async nextSubjectUp() {
        const editor = this.editor;

        editor.selections = editor.selections.map((selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            const nextLine = lines.getNextSignificantLine(
                editor.document,
                selection.end,
                "backwards"
            );

            if (nextLine) {
                return new vscode.Selection(
                    selection.start.with(nextLine.lineNumber),
                    selection.start.with(nextLine.lineNumber)
                );
            }

            return selection;
        });

        this.fixSelection();
    }

    async nextSubjectLeft() {
        const editor = this.editor;

        selections.map(editor, (selection) => {
            const wordRange = words.prevWord(editor.document, selection.start);

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        this.fixSelection();
    }

    async nextSubjectRight() {
        const editor = this.editor;

        selections.map(editor, (selection) => {
            const wordRange = words.nextWord(editor.document, selection.end);

            if (wordRange) {
                return new vscode.Selection(wordRange.end, wordRange.start);
            }

            return selection;
        });

        this.fixSelection();
    }

    async swapSubjectLeft() {
        await words.swapWordsWithNeighbours(this.editor, "backwards");
    }

    async swapSubjectRight() {
        await words.swapWordsWithNeighbours(this.editor, "forwards");
    }

    async firstSubjectInLine() {
        await vscode.commands.executeCommand("cursorHome");
        this.fixSelection();
    }

    async lastSubjectInLine(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
        this.fixSelection();
    }

    async deleteSubject() {
        const editor = this.editor;
        const charsToRemove = [" ", ",", ":", "."];

        for (const selection of this.editor.selections) {
            await this.editor.edit((e) => {
                e.delete(selection);

                let danglingTextRange = new vscode.Range(
                    positions.translateWithWrap(
                        editor.document,
                        selection.start,
                        -1
                    ) || selection.start,
                    selection.start
                );

                let danglingText = editor.document.getText(danglingTextRange);

                while (charsToRemove.includes(danglingText)) {
                    e.delete(danglingTextRange);

                    danglingTextRange = new vscode.Range(
                        positions.translateWithWrap(
                            editor.document,
                            danglingTextRange.start,
                            -1
                        ) || danglingTextRange.start,
                        danglingTextRange.start
                    );
                    danglingText = editor.document.getText(danglingTextRange);
                }
            });

            if (
                this.editor.document.lineAt(selection.active.line)
                    .isEmptyOrWhitespace
            ) {
                await vscode.commands.executeCommand(
                    "editor.action.deleteLines"
                );
            }
        }

        await this.fixSelection();
    }

    async search(target: Char) {
        selections.map(this.editor, (selection) => {
            const searchResult = words.search(
                this.editor,
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

    async searchBackwards(target: Char) {
        selections.map(this.editor, (selection) => {
            const searchResult = words.search(
                this.editor,
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
