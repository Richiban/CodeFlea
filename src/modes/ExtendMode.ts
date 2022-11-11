import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import ModeManager from "./ModeManager";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";

export default class ExtendMode extends EditorMode {
    constructor(
        private manager: ModeManager,
        public readonly subject: subjects.Subject,
        private previousMode: NavigateMode
    ) {
        super();
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.manager, this.previousMode);
            case "NAVIGATE":
                return this.previousMode;
            case "EXTEND":
                if (newMode.subjectName !== this.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new NavigateMode(
                        this.manager,
                        subjects.createFrom(this.manager, newMode.subjectName)
                    );
                }

                switch (newMode.subjectName) {
                    case "LINE":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "ALL_LINES")
                        );
                    case "WORD":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "SMALL_WORD")
                        );
                    case "SMALL_WORD":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "WORD")
                        );
                    case "ALL_LINES":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "LINE")
                        );
                }

                return this;
        }
    }

    async refreshUI() {
        this.manager.statusBar.text = `Navigate (${this.subject?.name})`;

        if (this.manager.editor) {
            this.manager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.BlockOutline;

            this.manager.editor.options.lineNumbers =
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
