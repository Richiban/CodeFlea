import * as common from "../common";
import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";

export default class ExtendMode extends EditorMode {
    constructor(
        private readonly context: common.ExtensionContext,
        public readonly subject: subjects.Subject,
        private previousMode: NavigateMode
    ) {
        super();
    }

    copy(): EditorMode {
        return new ExtendMode(this.context, this.subject, this.previousMode);
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, this.previousMode);
            case "NAVIGATE":
                return this.previousMode;
            case "EXTEND":
                if (newMode.subjectName !== this.subject.name) {
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
        this.context.statusBar.text = `Navigate (${this.subject?.name})`;

        if (this.context.editor) {
            this.context.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.BlockOutline;

            this.context.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "NAVIGATE"
        );

        this.subject?.fixSelection();

        await vscode.commands.executeCommand(
            "editor.action.setSelectionAnchor"
        );
    }

    async dispose() {
        this.subject.dispose();
        await vscode.commands.executeCommand(
            "editor.action.cancelSelectionAnchor"
        );
    }

    async executeSubjectCommand(
        command: keyof subjects.SubjectActions
    ): Promise<void> {
        //await this.subject[command]();
    }

    async repeatSubjectCommand() {}

    equals(previousMode: EditorMode): boolean {
        return (
            previousMode instanceof ExtendMode &&
            previousMode.subject === this.subject
        );
    }
}
