import ModeManager from "../modes/ModeManager";
import * as blocks from "../blocks";
import * as vscode from "vscode";
import { lineIsStopLine } from "../lines";

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

    deleteSubject(): Promise<void>;
    changeSubject(): Promise<void>;

    append(): Promise<void>;
    prepend(): Promise<void>;
};

export abstract class Subject implements SubjectActions {
    constructor(protected readonly manager: ModeManager) {}

    protected get editor() {
        return this.manager.editor;
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

    async append() {
        if (!this.editor) {
            return;
        }

        this.editor.selections = this.editor.selections.map((selection) => {
            return new vscode.Selection(selection.end, selection.end);
        });
    }

    async prepend() {
        if (!this.editor) {
            return;
        }

        this.editor.selections = this.editor.selections.map((selection) => {
            return new vscode.Selection(selection.start, selection.start);
        });
    }

    abstract name: SubjectType;
    abstract fixSelection(): void;

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
            return new LineSubject(manager);
        case "WORD":
            return new WordSubject(manager);
        case "ALL_LINES":
            return new AllLinesSubject(manager);
        case "SMALL_WORD":
            return new SmallWordSubject(manager);
        case "BLOCK":
            return new BlockSubject(manager);
    }
}
export class AllLinesSubject extends Subject {
    readonly name = "ALL_LINES";

    fixSelection(): void {
        const editor = this.manager.editor;

        if (!editor) {
            return;
        }

        editor.selections = editor.selections.map((selection) => {
            const startLine = editor.document.lineAt(selection.start.line);
            const endLine = editor.document.lineAt(selection.end.line);

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

    fixSelection() {
        if (!this.editor) {
            return;
        }

        this.editor.selections = this.editor.selections.map((selection) => {
            const startBlock = blocks.getContainingBlock(selection.start);
            const endBlock = blocks.getContainingBlock(selection.end);

            return new vscode.Selection(
                new vscode.Position(
                    startBlock.start.line,
                    startBlock.start.character
                ),
                new vscode.Position(
                    startBlock.end.line,
                    startBlock.end.character
                )
            );
        });
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
}

export class LineSubject extends Subject {
    readonly name = "LINE";

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
        this.fixSelection();
    }

    fixSelection() {
        const editor = this.manager.editor;

        if (!editor) {
            return;
        }

        editor.selections = editor.selections.map((selection) => {
            const startLine = editor.document.lineAt(selection.start.line);
            const endLine = editor.document.lineAt(selection.end.line);

            return new vscode.Selection(
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                ),
                endLine.range.end
            );
        });
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");

        const editor = this.manager.editor;

        if (!editor) {
            return;
        }

        while (
            editor.selections.reduce(
                (state, selection) =>
                    state &&
                    selection.isSingleLine &&
                    selection.start.line < editor.document.lineCount - 1 &&
                    lineIsStopLine(
                        editor.document.lineAt(selection.start.line)
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
        const editor = this.manager.editor;

        if (!editor) {
            return;
        }

        while (
            editor.selections.reduce(
                (state, selection) =>
                    state &&
                    selection.isSingleLine &&
                    selection.start.line > 0 &&
                    lineIsStopLine(
                        editor.document.lineAt(selection.start.line)
                    ),
                true
            )
        ) {
            await vscode.commands.executeCommand("cursorUp");
        }

        this.fixSelection();
    }

    async nextSubjectLeft() {}
    async nextSubjectRight() {}

    async swapSubjectDown() {
        await vscode.commands.executeCommand(
            "editor.action.moveLinesDownAction"
        );
    }
    async swapSubjectUp() {
        await vscode.commands.executeCommand("editor.action.moveLinesUpAction");
    }
    async swapSubjectLeft() {}
    async swapSubjectRight() {}
}

export class SmallWordSubject extends Subject {
    readonly name = "SMALL_WORD";

    fixSelection(): void {}

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async nextSubjectLeft() {
        await vscode.commands.executeCommand("cursorWordPartLeft");
    }

    async nextSubjectRight() {
        await vscode.commands.executeCommand("cursorWordPartRight");
    }
}

export class WordSubject extends Subject {
    readonly name = "WORD";

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    fixSelection() {
        const editor = this.editor;

        if (!editor) {
            return;
        }

        editor.selections = editor.selections.map((selection) => {
            let [newStart, newEnd] = [selection.start, selection.end];

            const leftWord = editor.document.getWordRangeAtPosition(
                selection.start
            );

            if (leftWord && !selection.start.isEqual(leftWord.start)) {
                newStart = leftWord.start;
            }

            const rightWord = editor.document.getWordRangeAtPosition(
                selection.end
            );

            if (rightWord && !selection.end.isEqual(rightWord.end)) {
                newEnd = rightWord.end;
            }

            return new vscode.Selection(newStart, newEnd);
        });
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
        this.fixSelection();
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
        this.fixSelection();
    }

    async nextSubjectLeft() {
        if (!this.editor) {
            return;
        }

        this.editor.selections = this.editor.selections.map((selection) => {
            if (!selection.isReversed) {
                return new vscode.Selection(selection.end, selection.start);
            }

            return selection;
        });

        await vscode.commands.executeCommand("cursorWordLeft");
        this.fixSelection();
    }

    async nextSubjectRight() {
        if (!this.editor) {
            return;
        }

        this.editor.selections = this.editor.selections.map((selection) => {
            if (selection.isReversed) {
                return new vscode.Selection(selection.end, selection.start);
            }

            return selection;
        });

        await vscode.commands.executeCommand("cursorWordRight");
        this.fixSelection();
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("deleteRight");

        if (!this.editor) {
            return;
        }

        for (const selection of this.editor.selections) {
            const s = new vscode.Range(
                selection.active.translate(undefined, -1),
                selection.active.translate(undefined, 1)
            );

            if (
                this.editor.document.lineAt(selection.active.line)
                    .isEmptyOrWhitespace
            ) {
                // TODO delete empty line
            } else if (this.editor.document.getText(s) === "  ") {
                // TODO collapse selection first
                await vscode.commands.executeCommand("deleteInsideWord");
            }
        }

        await this.fixSelection();
    }
}
