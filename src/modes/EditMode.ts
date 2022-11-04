import * as vscode from "vscode";
import ExtendMode from "./ExtendMode";
import NavigateMode from "./NavigateMode";
import { EditorMode, EditorModeName } from "./modes";
import ModeManager from "./ModeManager";
import { Subject, SubjectAction } from "../subjects/subjects";

export default class EditMode implements EditorMode {
    private keySequenceStarted: boolean = false;

    constructor(
        private manager: ModeManager,
        private previousNavigateMode: NavigateMode
    ) {}

    changeSubject(): void {}

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return this;
            case "EXTEND":
                return new ExtendMode(this.manager, this.previousNavigateMode);
            case "NAVIGATE":
                return this.previousNavigateMode;
        }
    }

    onCharTyped(typed: { text: string }): EditorMode {
        if (this.keySequenceStarted) {
            if (
                typed.text === this.manager.config.modes.navigateKeySequence[1]
            ) {
                this.keySequenceStarted = false;

                return this.previousNavigateMode;
            } else {
                this.keySequenceStarted = false;

                vscode.commands.executeCommand("default:type", {
                    text: `${this.manager.config.modes.navigateKeySequence[0]}${typed.text}`,
                });
            }
        } else {
            if (
                typed.text === this.manager.config.modes.navigateKeySequence[0]
            ) {
                this.keySequenceStarted = true;
                setTimeout(() => {
                    if (this.keySequenceStarted === false) {
                        return;
                    }

                    this.keySequenceStarted = false;
                    vscode.commands.executeCommand("default:type", typed);
                }, 500);
            } else {
                this.keySequenceStarted = false;

                vscode.commands.executeCommand("default:type", typed);
            }
        }

        return this;
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Edit`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.Line;
            editorManager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.On;
        }

        vscode.commands.executeCommand("setContext", "codeFlea.mode", "EDIT");
    }

    async executeSubjectCommand(command: keyof SubjectAction) {}
}
