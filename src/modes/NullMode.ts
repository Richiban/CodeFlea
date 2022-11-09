import * as vscode from "vscode";
import { createFrom, SubjectActions } from "../subjects/subjects";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import ModeManager from "./ModeManager";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";

export class NullMode extends EditorMode {
    constructor(private manager: ModeManager) {
        super();
    }

    equals(previousMode: EditorMode): boolean {
        return previousMode instanceof NullMode;
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        const defaultSubject = createFrom(this.manager, "WORD");
        const navigateMode = new NavigateMode(this.manager, defaultSubject);

        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.manager, navigateMode);

            case "EXTEND":
                return new ExtendMode(
                    this.manager,
                    defaultSubject,
                    navigateMode
                );

            case "NAVIGATE":
                return navigateMode;
        }
    }

    refreshUI(editorManager: ModeManager): void {
        editorManager.statusBar.text = `Initialising...`;
    }

    async executeSubjectCommand(command: keyof SubjectActions | "name") {}

    async repeatSubjectCommand() {}
}
