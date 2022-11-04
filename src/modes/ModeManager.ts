import * as vscode from "vscode";
import { Config } from "../config";
import { NullMode } from "./NullMode";
import { EditorMode, EditorModeName } from "./modes";
import { Subject, SubjectAction, SubjectName } from "../subjects/subjects";

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

    changeMode(newMode: "NAVIGATE", subject: SubjectName): void;
    changeMode(newMode: EditorModeName): void;
    changeMode(newMode: EditorModeName, subject?: SubjectName) {
        const previousMode = this.mode;
        this.mode = this.mode.changeTo(newMode);

        if (subject) {
            this.mode.changeSubject(subject);
        }

        if (this.mode !== previousMode) {
            this.mode.refreshUI(this);
        }
    }

    async executeCommand(command: keyof SubjectAction) {
        this.mode.executeSubjectCommand(command);
    }

    onCharTyped(typed: { text: string }) {
        this.mode = this.mode.onCharTyped(typed);

        this.mode.refreshUI(this);
    }
}
