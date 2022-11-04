import * as vscode from "vscode";
import { selectWordUnderCursor } from "../words";
import * as modes from "./modes";
import * as subjects from "../subjects/subjects";
import ModeManager from "./ModeManager";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";

export default class NavigateMode implements modes.EditorMode {
    subject: subjects.Subject = undefined!;

    constructor(
        private manager: ModeManager,
        subjectType: subjects.SubjectName
    ) {
        this.changeSubject(subjectType);
    }

    changeSubject(subjectName: subjects.SubjectName): void {
        this.subject = subjects.createFrom(this.manager, subjectName);
    }

    changeTo(newMode: modes.EditorModeName): modes.EditorMode {
        switch (newMode) {
            case "EDIT":
                return new EditMode(this.manager, this);
            case "EXTEND":
                return new ExtendMode(this.manager, this);
            case "NAVIGATE":
                return this;
        }
    }

    onCharTyped(typed: { text: string }): modes.EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Navigate (${this.subject.name})`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.Block;
            editorManager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
            selectWordUnderCursor(editorManager.editor);
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "NAVIGATE"
        );
    }

    async executeSubjectCommand(command: keyof subjects.SubjectAction) {
        this.subject[command]();
    }
}
