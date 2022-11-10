import * as vscode from "vscode";
import { Config } from "../config";
import { inputBoxChar, quickCommandPicker } from "../utils/editor";
import { GoToCommands, SpaceCommands } from "../utils/quickMenus";
import { SubjectActions } from "../subjects/subjects";
import { EditorMode, EditorModeType } from "./modes";
import { NullMode } from "./NullMode";

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

    async executeSubjectCommand(command: keyof SubjectActions) {
        console.log(`Executing subject command (${command})`);
        await this.mode.executeSubjectCommand(command);
    }

    async repeatSubjectCommand() {
        await this.mode.repeatSubjectCommand();
    }

    async fixSelection() {
        await this.mode.fixSelection();
    }

    onCharTyped(typed: { text: string }) {
        this.mode = this.mode.onCharTyped(typed);

        this.mode.refreshUI(this);
    }

    async openSpaceMenu() {
        const choice = await quickCommandPicker(SpaceCommands);

        if (choice) {
            await choice.execute();
        }
    }

    async openGoToMenu() {
        const choice = await quickCommandPicker(GoToCommands);

        if (choice) {
            await choice.execute();
        }
    }

    async customVsCodeCommand() {
        const command = await vscode.window.showInputBox({
            prompt: "Custom VS Code command",
        });

        if (command) {
            await vscode.commands.executeCommand(command);
        }
    }
}
