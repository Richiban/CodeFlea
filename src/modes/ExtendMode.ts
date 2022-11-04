import * as vscode from "vscode";
import NavigateMode from "./NavigateMode";
import { EditorMode, EditorModeName } from "./modes";
import { SubjectName, Subject, SubjectAction } from "../subjects/subjects";
import ModeManager from "./ModeManager";
import EditMode from "./EditMode";

export default class ExtendMode implements EditorMode {
    constructor(
        private manager: ModeManager,
        private previousNavigateMode: NavigateMode
    ) {}

    changeSubject(subject: SubjectName): void {
        this.previousNavigateMode.changeSubject(subject);
    }

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return new EditMode(this.manager, this.previousNavigateMode);
            case "EXTEND":
                return this;
            case "NAVIGATE":
                return this.previousNavigateMode;
        }
    }

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Extend (${this.previousNavigateMode.subject})`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.BlockOutline;
            editorManager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        vscode.commands.executeCommand("setContext", "codeFlea.mode", "EXTEND");
    }

    async executeSubjectCommand(command: keyof SubjectAction) {
        // TODO add subject and execute
    }
}
