import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import ModeManager from "./ModeManager";
import * as modes from "./modes";

export default class NavigateMode implements modes.EditorMode {
    subject: subjects.Subject;

    constructor(
        private manager: ModeManager,
        subjectType: subjects.SubjectType
    ) {
        this.subject = subjects.createFrom(manager, subjectType);
    }

    equals(previousMode: modes.EditorMode): boolean {
        return (
            previousMode instanceof NavigateMode &&
            previousMode.subject === this.subject
        );
    }

    async changeTo(newMode: modes.EditorModeType): Promise<modes.EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.manager, this);

            case "NAVIGATE":
                if (newMode.subjectName !== this.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new NavigateMode(this.manager, newMode.subjectName);
                }

                switch (newMode.subjectName) {
                    case "LINE":
                        return new NavigateMode(this.manager, "ALL_LINES");
                    case "WORD":
                        return new NavigateMode(this.manager, "SMALL_WORD");
                    case "SMALL_WORD":
                        return new NavigateMode(this.manager, "WORD");
                    case "ALL_LINES":
                        return new NavigateMode(this.manager, "LINE");
                }

                return this;
        }
    }

    onCharTyped(typed: { text: string }): modes.EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Navigate (${this.subject?.name})`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.UnderlineThin;

            editorManager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "NAVIGATE"
        );

        this.subject?.fixSelection();
    }

    async executeSubjectCommand(command: keyof subjects.SubjectActions) {
        this.subject[command]();
    }
}
