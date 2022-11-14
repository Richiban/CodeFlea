import * as common from "../common";
import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";
import * as selections from "../utils/selections";

export default class ExtendMode extends EditorMode {
    private readonly wrappedMode: NavigateMode;

    constructor(
        private readonly context: common.ExtensionContext,
        previousMode: NavigateMode
    ) {
        super();

        this.wrappedMode = previousMode;
    }

    async fixSelection() {
        await this.wrappedMode.fixSelection();
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, this.wrappedMode);
            case "NAVIGATE":
                return this.wrappedMode;
            case "EXTEND":
                if (newMode.subjectName !== this.wrappedMode.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new NavigateMode(
                        this.context,
                        subjects.createFrom(this.context, newMode.subjectName)
                    );
                }

                switch (newMode.subjectName) {
                    case "LINE":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "ALL_LINES")
                        );
                    case "WORD":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "SMALL_WORD")
                        );
                    case "SMALL_WORD":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "WORD")
                        );
                    case "ALL_LINES":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "LINE")
                        );
                }

                return this;
        }
    }

    clearUI(): void {}

    async refreshUI() {
        this.context.statusBar.text = `Extend (${this.wrappedMode.subject?.name})`;

        if (this.context.editor) {
            this.context.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.BlockOutline;

            this.context.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        await vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "EXTEND"
        );

        this.wrappedMode.fixSelection();
    }

    async executeSubjectCommand(
        command: keyof subjects.SubjectActions
    ): Promise<void> {
        const existingSelections = new common.Linqish(
            this.context.editor.selections
        );

        await this.wrappedMode.executeSubjectCommand(command);

        const newSelections = existingSelections
            .zipWith(this.context.editor.selections)
            .map(([a, b]) => {
                return new vscode.Selection(a.start, b.end);
            })
            .toArray();

        this.context.editor.selections = newSelections;
    }

    async repeatSubjectCommand() {}

    equals(other: EditorMode): boolean {
        return (
            other instanceof ExtendMode &&
            other.wrappedMode.equals(this.wrappedMode)
        );
    }
}
