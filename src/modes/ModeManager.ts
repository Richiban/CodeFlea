import * as vscode from "vscode";
import { Config } from "../config";
import { NullMode } from "./NullMode";
import { EditorMode, EditorModeType } from "./modes";
import { SubjectActions } from "../subjects/subjects";

export default class ModeManager {
    private mode: EditorMode;
    public statusBar: vscode.StatusBarItem;
    public editor: vscode.TextEditor | undefined;

    constructor(editor: vscode.TextEditor | undefined, public config: Config) {
        this.statusBar = vscode.window.createStatusBarItem(
            "codeFlea",
            vscode.StatusBarAlignment.Left,
            0
        );

        this.mode = new NullMode(this);

        this.editor = editor;
        this.statusBar.show();
    }

    setEditor(editor: vscode.TextEditor | undefined) {
        this.editor = editor;

        this.mode.refreshUI(this);
    }

    async changeMode(newMode: EditorModeType) {
        const previousMode = this.mode;
        this.mode = await this.mode.changeTo(newMode);

        if (!this.mode.equals(previousMode)) {
            previousMode.end();
            this.mode.refreshUI(this);
        }
    }

    async executeCommand(command: keyof SubjectActions) {
        this.mode.executeSubjectCommand(command);
    }

    onCharTyped(typed: { text: string }) {
        this.mode = this.mode.onCharTyped(typed);

        this.mode.refreshUI(this);
    }
}
