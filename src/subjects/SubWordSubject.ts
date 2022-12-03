import * as vscode from "vscode";
import * as words from "../utils/words";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { Subject } from "./Subject";

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
        selections.tryMap(this.context.editor, (selection) =>
            words
                .iterSubwords(
                    this.context.editor.document,
                    selection.start,
                    "backwards"
                )
                .tryFirst()
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            words
                .iterSubwords(
                    this.context.editor.document,
                    selection.end,
                    "forwards"
                )
                .tryFirst()
        );
    }

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastSubjectInScope() {
        await vscode.commands.executeCommand("cursorEnd");
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.searchSubword(
                this.context.editor.document,
                selection.end,
                target,
                "forwards"
            )
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.searchSubword(
                this.context.editor.document,
                selection.start,
                target,
                "backwards"
            )
        );
    }

    async fixSelection() {
        if (!this.context.editor) {
            return;
        }

        selections.tryMap(this.context.editor, (selection) => {
            const wordRange = words.expandSelectionToSubwords(
                this.context.editor.document,
                selection
            );

            return wordRange ?? selection;
        });

        this.context.editor.setDecorations(
            SubWordSubject.decorationType,
            this.context.editor.selections
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    clearUI(): void {
        this.context.editor.setDecorations(SubWordSubject.decorationType, []);
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return words.iterSubwords(
            this.context.editor.document,
            this.context.editor.selection.start,
            direction
        );
    }
}
