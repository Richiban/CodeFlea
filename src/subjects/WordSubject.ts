import * as vscode from "vscode";
import * as words from "../utils/words";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { Subject } from "./Subject";

export class WordSubject extends Subject {
    readonly name = "WORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #964d4d;",
            cursor: "color: rgba(0, 255, 0, 0);",
        }
    );

    public static quickNumberDecoration =
        vscode.window.createTextEditorDecorationType({});

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

        selections.tryMap(this.context.editor, (selection) =>
            words.expandSelectionToWords(
                this.context.editor.document,
                selection
            )
        );

        this.context.editor.setDecorations(
            WordSubject.decorationType,
            this.context.editor.selections
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    async nextSubjectDown() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWordUpDown(
                this.context.editor.document,
                selection.active,
                "down"
            )
        );
    }

    async nextSubjectUp() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWordUpDown(
                this.context.editor.document,
                selection.active,
                "up"
            )
        );
    }

    async nextSubjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWord(
                this.context.editor.document,
                selection.start,
                "backwards"
            )
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWord(
                this.context.editor.document,
                selection.end,
                "forwards"
            )
        );
    }

    async swapSubjectLeft() {
        await words.swapWordsWithNeighbors(this.context.editor, "backwards");
    }

    async swapSubjectRight() {
        await words.swapWordsWithNeighbors(this.context.editor, "forwards");
    }

    async firstSubjectInScope() {
        if (true) {
            await vscode.commands.executeCommand("cursorHome");
        }
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
    }

    async deleteSubject() {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                words.deleteWord(this.context.editor.document, e, selection);
            }
        });
    }

    async duplicateSubject(): Promise<void> {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                words.duplicateWord(this.context.editor.document, e, selection);
            }
        });
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.search(this.context.editor, selection.end, target, "forwards")
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.search(
                this.context.editor,
                selection.start,
                target,
                "backwards"
            )
        );
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return words.iterWords(
            this.context.editor.document,
            this.context.editor.selection.start,
            direction
        );
    }
}
