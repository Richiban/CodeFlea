import * as vscode from "vscode";
import { SubjectActions } from "../subjects/subjects";
import ExtendMode from "./ExtendMode";
import ModeManager from "./ModeManager";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";

export default class EditMode extends EditorMode {
    private keySequenceStarted: boolean = false;

    public decorationType = vscode.window.createTextEditorDecorationType({});

    constructor(
        private manager: ModeManager,
        private previousNavigateMode: NavigateMode
    ) {
        super();
    }

    equals(previousMode: EditorMode): boolean {
        return (
            previousMode instanceof EditMode &&
            previousMode.keySequenceStarted === this.keySequenceStarted
        );
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return this;
            case "EXTEND":
                return new ExtendMode(
                    this.manager,
                    this.previousNavigateMode.subject,
                    this.previousNavigateMode
                );

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
                }, 100);
            } else {
                this.keySequenceStarted = false;

                vscode.commands.executeCommand("default:type", typed);
            }
        }

        return this;
    }

    async refreshUI() {
        this.manager.statusBar.text = `Edit`;

        if (this.manager.editor) {
            this.manager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.Line;
            this.manager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.On;
        }

        await vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "EDIT"
        );
    }

    async executeSubjectCommand(command: keyof SubjectActions) {}

    async repeatSubjectCommand() {}
}
