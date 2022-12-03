import * as vscode from "vscode";
import { Config } from "../config";
import { goToLine, quickCommandPicker } from "../utils/editor";
import {
    GoToCommands,
    SpaceCommands,
    ModifyCommands,
} from "../utils/quickMenus";
import { createFrom } from "../utils/subjects";
import { SubjectActions } from "../subjects/SubjectActions";
import { EditorMode, EditorModeType } from "./modes";
import { NullMode } from "./NullMode";
import EditMode from "./EditMode";
import NavigateMode from "./NavigateMode";

export default class ModeManager {
    private mode: EditorMode;
    public statusBar: vscode.StatusBarItem;
    public editor: vscode.TextEditor = undefined!;

    constructor(public config: Config) {
        this.statusBar = vscode.window.createStatusBarItem(
            "codeFlea",
            vscode.StatusBarAlignment.Left,
            0
        );

        this.mode = new NullMode(this);

        this.statusBar.show();
    }

    async changeEditor(editor: vscode.TextEditor | undefined) {
        this.mode.clearUI();

        if (!editor) {
            this.mode = new NullMode(this);
            return;
        } else {
            if (this.mode instanceof NullMode) {
                await this.changeMode({
                    kind: "NAVIGATE",
                    subjectName: "WORD",
                });
            }
        }

        this.editor = editor;

        this.mode.refreshUI();
    }

    async changeMode(newMode: EditorModeType) {
        const previousMode = this.mode;

        this.mode = await this.mode.changeTo(newMode);

        previousMode.clearUI();
        this.mode.refreshUI();
    }

    async changeNumHandler() {
        this.mode.clearUI();
        this.mode = this.mode.changeNumHandler();
        this.mode.refreshUI();
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

        this.mode.refreshUI();
    }

    async openSpaceMenu() {
        const choice = await quickCommandPicker(SpaceCommands, {
            allowFreeEntry: false,
        });

        if (choice) {
            await choice.execute();
        }
    }

    async openGoToMenu() {
        const choice = await quickCommandPicker(GoToCommands, {
            allowFreeEntry: true,
        });

        if (typeof choice === "string") {
            const parsed = parseInt(choice);

            if (isNaN(parsed)) {
                vscode.window.showErrorMessage(
                    `${choice} is not a valid line number`
                );
            }

            await goToLine(this.editor, parsed);
        } else if (choice) {
            choice.execute();
        }

        this.mode.fixSelection();
    }

    async openModifyMenu() {
        const choice = await quickCommandPicker(ModifyCommands, {
            allowFreeEntry: false,
        });

        if (choice) {
            await choice.execute();
        }

        this.mode.fixSelection();
    }

    async customVsCodeCommand() {
        const command = await vscode.window.showInputBox({
            prompt: "Custom VS Code command",
        });

        if (command) {
            await vscode.commands.executeCommand(command);
        }

        this.mode.fixSelection();
    }

    async undoLastCommand() {
        await vscode.commands.executeCommand("cursorUndo");

        this.mode.fixSelection();
    }
}
