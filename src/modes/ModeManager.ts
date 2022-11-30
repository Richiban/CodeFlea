import * as vscode from "vscode";
import { Config } from "../config";
import { goToLine, quickCommandPicker } from "../utils/editor";
import {
    GoToCommands,
    SpaceCommands,
    ModifyCommands,
} from "../utils/quickMenus";
import { SubjectActions } from "../subjects/subjects";
import { EditorMode, EditorModeType } from "./modes";
import { NullMode } from "./NullMode";
import * as common from "../common";
import { tryMap } from "../utils/selectionsAndRanges";

export default class ModeManager {
    private mode: EditorMode;
    public statusBar: vscode.StatusBarItem;
    public editor: vscode.TextEditor = undefined!;
    private readonly messageBuffer: common.Msg[] = [];

    constructor(public config: Config) {
        this.statusBar = vscode.window.createStatusBarItem(
            "codeFlea",
            vscode.StatusBarAlignment.Left,
            0
        );

        this.mode = new NullMode(this);

        this.statusBar.show();
    }

    dispatch(...messages: common.Msg[]) {
        return this.messageBuffer.push(...messages);
    }

    private async flushMessages() {
        for (const message of this.messageBuffer) {
            await this.handle(message);
        }
    }

    private async handle(message: common.Msg) {
        switch (message.kind) {
            case "changeMode":
                this.changeMode(message.newMode);
                break;
            case "vscodeCommand":
                await vscode.commands.executeCommand(message.command);
                break;
            case "mapEditorSelections":
                this.editor.selections = tryMap(this.editor, message.mapper);

                this.editor.setDecorations(
                    message.decorationType,
                    this.editor.selections
                );

                this.editor.revealRange(this.editor.selection);
                break;
            case "setEditorDecorations":
                this.editor.setDecorations(
                    message.decorationType,
                    message.targets
                );
                break;
            case "clearEditorDecorations":
                this.editor.setDecorations(message.decorationType, []);
                break;
            case "setStatusBarText":
                this.statusBar.text = message.text;
                break;
            case "scrollEditor":
                this.editor.revealRange(message.revealRange);
                break;
            case "customEdit":
                this.editor.edit(message.edit);
                break;
            case "customEditPerSelection":
                this.editor.edit((e) => {
                    for (const selection of this.editor.selections) {
                        message.edit(e, selection);
                    }
                });
            default:
                throw new Error("Unhandled message");
        }
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

        if (!this.mode.equals(previousMode)) {
            previousMode.clearUI();
            this.mode.refreshUI();
        }
    }

    async changeNumHandler() {
        this.mode.clearUI();
        this.mode = this.mode.changeNumHandler();
        this.mode.refreshUI();
    }

    async executeSubjectCommand(command: keyof SubjectActions) {
        console.log(`Executing subject command (${command})`);
        await this.mode.executeSubjectCommand(command);
        await this.flushMessages();
    }

    async repeatSubjectCommand() {
        await this.mode.repeatSubjectCommand();
        await this.flushMessages();
    }

    async fixSelection() {
        await this.mode.fixSelection();
        await this.flushMessages();
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

            await goToLine(parsed);
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
