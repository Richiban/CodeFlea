import * as vscode from "vscode";
import { Config } from "./config";
import { goToLine, quickCommandPicker } from "./utils/editor";
import {
    GoToCommands,
    SpaceCommands,
    ModifyCommands,
} from "./utils/quickMenus";
import { SubjectAction } from "./subjects/SubjectActions";
import { EditorMode, EditorModeChangeRequest } from "./modes/modes";
import NullMode from "./modes/NullMode";
import InsertMode from "./modes/InsertMode";
import { createDefaultNumHandler, NumHandler } from "./handlers/NumHandler";

export default class CodeFleaManager {
    private mode: EditorMode;
    public statusBar: vscode.StatusBarItem;
    public editor: vscode.TextEditor = undefined!;
    private numHandler: NumHandler;

    constructor(public config: Config) {
        this.statusBar = vscode.window.createStatusBarItem(
            "codeFlea",
            vscode.StatusBarAlignment.Left,
            0
        );

        this.mode = new NullMode(this);

        this.statusBar.show();

        this.numHandler = createDefaultNumHandler(this);
    }

    async changeEditor(editor: vscode.TextEditor | undefined) {
        this.clearUI();

        if (!editor) {
            this.mode = new NullMode(this);
            return;
        }

        this.editor = editor;

        if (this.mode instanceof NullMode) {
            await this.changeMode({
                kind: "FLEA",
                subjectName: "WORD",
            });
        }

        this.setUI();
    }

    clearUI() {
        if (this.mode.decorationType) {
            this.editor.setDecorations(this.mode.decorationType, []);
        }
    }

    async changeMode(newMode: EditorModeChangeRequest) {
        this.clearUI();

        this.mode = await this.mode.changeTo(newMode);

        this.setUI();
        this.mode.fixSelection();
    }

    async changeNumHandler() {
        this.clearUI();
        this.numHandler = this.numHandler.change();
        this.setUI();
    }

    async executeSubjectCommand(command: SubjectAction) {
        console.log(`Executing subject command (${command})`);
        await this.mode.executeSubjectCommand(command);
    }

    async repeatSubjectCommand() {
        await this.mode.repeatSubjectCommand();
    }

    async onDidChangeTextEditorSelection(
        event: vscode.TextEditorSelectionChangeEvent
    ) {
        if (this.mode?.decorationType) {
            this.editor.setDecorations(
                this.mode.decorationType,
                this.editor.selections
            );

            this.editor.revealRange(this.editor.selection);
        }

        if (event.kind === vscode.TextEditorSelectionChangeKind.Command) return;
        if (this.mode instanceof InsertMode) return;

        if (
            event.kind === vscode.TextEditorSelectionChangeKind.Mouse &&
            event.selections.length === 1 &&
            !event.selections[0].isEmpty
        ) {
            await this.changeMode({ kind: "INSERT" });
            return;
        }

        this.mode.fixSelection();
        this.setUI();
    }

    setUI() {
        this.statusBar.text = this.mode.statusBarText;

        if (this.editor) {
            this.editor.options.cursorStyle = this.mode.cursorStyle;
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            this.mode.name
        );
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

    async undo() {
        await vscode.commands.executeCommand("undo");

        this.mode.fixSelection();
    }

    async jump() {
        await this.mode.jump();
    }
}
