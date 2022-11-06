import ModeManager from "../modes/ModeManager";
import * as blocks from "../blocks";
import * as vscode from "vscode";

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
};

export abstract class Subject implements SubjectActions {
    constructor(protected readonly manager: ModeManager) {}

    protected get editor() {
        return this.manager.editor;
    }

    async nextSubjectDown(): Promise<void> {}
    async nextSubjectUp(): Promise<void> {}
    async nextSubjectLeft(): Promise<void> {}
    async nextSubjectRight(): Promise<void> {}
    async addSubjectDown(): Promise<void> {}
    async addSubjectUp(): Promise<void> {}
    async addSubjectLeft(): Promise<void> {}
    async addSubjectRight(): Promise<void> {}
    async extendSubjectDown(): Promise<void> {}
    async extendSubjectUp(): Promise<void> {}
    async extendSubjectLeft(): Promise<void> {}
    async extendSubjectRight(): Promise<void> {}
    async swapSubjectDown(): Promise<void> {}
    async swapSubjectUp(): Promise<void> {}
    async swapSubjectLeft(): Promise<void> {}
    async swapSubjectRight(): Promise<void> {}
    async deleteSubject(): Promise<void> {}
    async changeSubject(): Promise<void> {}

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
        throw new Error("Method not implemented.");
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
                    editor.document.lineAt(selection.active)
                        .isEmptyOrWhitespace,
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
                    editor.document.lineAt(selection.active)
                        .isEmptyOrWhitespace,
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

    fixSelection(): void {
        throw new Error("Method not implemented.");
    }
    equals(other: Subject): boolean {
        throw new Error("Method not implemented.");
    }
}

export class WordSubject extends Subject {
    readonly name = "WORD";

    changeSubject() {
        return this.deleteSubject();
    }

    equals(other: Subject) {
        return this.name === other.name;
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

            if (this.editor.document.getText(s) === "  ") {
                await vscode.commands.executeCommand("deleteRight");
            }
        }

        await this.fixSelection();
    }
}
