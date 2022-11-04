import * as vscode from "vscode";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import NavigateMode from "./NavigateMode";
import { EditorMode, EditorModeName } from "./modes";
import ModeManager from "./ModeManager";
import { SubjectAction } from "../subjects/subjects";

export class NullMode implements EditorMode {
    constructor(private manager: ModeManager) {}

    changeSubject(): void {}

    changeTo(newMode: EditorModeName): EditorMode {
        const navigateMode = new NavigateMode(this.manager, "WORD");

        switch (newMode) {
            case "EDIT":
                return new EditMode(this.manager, navigateMode);
            case "EXTEND":
                return new ExtendMode(this.manager, navigateMode);
            case "NAVIGATE":
                return navigateMode;
        }
    }

    refreshUI(editorManager: ModeManager): void {
        editorManager.statusBar.text = `Initialising...`;
    }

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    async executeSubjectCommand(command: keyof SubjectAction | "name") {}
}
