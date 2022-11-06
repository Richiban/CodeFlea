import * as vscode from "vscode";
import { SubjectActions } from "../subjects/subjects";
import EditMode from "./EditMode";
import ModeManager from "./ModeManager";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";

export class NullMode implements EditorMode {
    constructor(private manager: ModeManager) {}

    equals(previousMode: EditorMode): boolean {
        return previousMode instanceof NullMode;
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        const navigateMode = new NavigateMode(this.manager, "WORD");

        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.manager, navigateMode);

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

    async executeSubjectCommand(command: keyof SubjectActions | "name") {}
}
