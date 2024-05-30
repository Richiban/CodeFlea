import * as vscode from "vscode";
import { Config } from "./config";
import { goToLine, quickCommandPicker } from "./utils/editor";
import * as quickMenus from "./utils/quickMenus";
import { SubjectAction } from "./subjects/SubjectActions";
import { EditorMode, EditorModeChangeRequest } from "./modes/modes";
import NullMode from "./modes/NullMode";
import InsertMode from "./modes/InsertMode";
import * as common from "./common";
import { SubjectName } from "./subjects/SubjectName";
import * as modifications from "./utils/modifications";
import { splitRange } from "./utils/decorations";

export default class CodeFleaManager {
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
        this.clearSelections();

        if (!editor) {
            return;
        }

        this.editor = editor;

        if (this.mode instanceof NullMode) {
            await this.changeMode({
                kind: "COMMAND",
                subjectName: "WORD",
            });
        }

        this.setUI();
    }

    clearSelections() {
        if (this.mode.decorationType) {
            this.editor.setDecorations(this.mode.decorationType, []);
        }
        
        if (this.mode.decorationTypeTop) {
            this.editor.setDecorations(this.mode.decorationTypeTop, []);
        }
        
        if (this.mode.decorationTypeMid) {
            this.editor.setDecorations(this.mode.decorationTypeMid, []);
        }
        
        if (this.mode.decorationTypeBottom) {
            this.editor.setDecorations(this.mode.decorationTypeBottom, []);
        }
    }

    async changeMode(newMode: EditorModeChangeRequest) {
        this.clearSelections();

        this.mode = await this.mode.changeTo(newMode);

        this.setUI();
        this.mode.fixSelection();
        this.setDecorations();
    }

    async executeSubjectCommand(command: SubjectAction) {
        await this.mode.executeSubjectCommand(command);
    }

    async executeModifyCommand(command: modifications.ModifyCommand) {
        await modifications.executeModifyCommand(command);
    }

    async onDidChangeTextEditorSelection(
        event: vscode.TextEditorSelectionChangeEvent
    ) {
        this.clearSelections();
        this.setDecorations();

        if (
            event.kind === vscode.TextEditorSelectionChangeKind.Command ||
            event.kind === undefined
        ) {
            this.editor.revealRange(this.editor.selection);
            return;
        }

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

    async setDecorations() {
        if (this.mode?.decorationType) {
            for (const selection of this.editor.selections) {
                const splits = splitRange(this.editor.document, selection);

                if (splits.kind === 'SingleLine') {
                    this.editor.setDecorations(
                        this.mode.decorationType,
                        [splits.range]
                    );
                }
                else {
                    this.editor.setDecorations(
                        this.mode.decorationTypeTop ?? this.mode.decorationType,
                        [splits.firstLine]
                    );

                    this.editor.setDecorations(
                        this.mode.decorationTypeMid ?? this.mode.decorationType,
                        splits.middleLines
                    );

                    this.editor.setDecorations(
                        this.mode.decorationTypeBottom ?? this.mode.decorationType,
                        [splits.lastLine]
                    );                
                }
            }
        }
    }

    setUI() {
        this.statusBar.text = this.mode.statusBarText;

        if (this.editor) {
            this.editor.options.cursorStyle = this.mode.cursorStyle;
            this.editor.options.lineNumbers = this.mode.lineNumberStyle;
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            this.mode.name
        );
    }

    async openSpaceMenu() {
        const choice = await quickCommandPicker(quickMenus.SpaceCommands);

        if (choice) {
            await choice.execute();
        }
    }

    async openGoToMenu() {
        const choice = await quickCommandPicker(quickMenus.GoToCommands, {
            label: "Go to line...",
            detail: "Enter a line number",
        });

        if (typeof choice === "string") {
            const parsed = parseInt(choice);

            if (isNaN(parsed)) {
                vscode.window.showErrorMessage(
                    `${choice} is not a valid line number`
                );
            }

            await goToLine(this.editor, parsed - 1);
        } else if (choice) {
            choice.execute();
        }

        this.mode.fixSelection();
    }

    async openModifyMenu() {
        const choice = await quickCommandPicker(quickMenus.ModifyCommands);

        if (choice) {
            await choice.execute();
        }

        this.mode.fixSelection();
    }

    async openViewMenu() {
        const choice = await quickCommandPicker(quickMenus.ViewCommands);

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

    async skip(direction: common.Direction) {
        await this.mode.skip(direction);
        this.setUI();
    }

    async skipOver(direction: common.Direction) {
        await this.mode.skipOver(direction);
        this.setUI();
    }

    async repeatLastSkip(direction: common.Direction) {
        await this.mode.repeatLastSkip(direction);
    }

    async jump() {
        await this.mode.jump();
    }

    async jumpToSubject(subjectName: SubjectName) {
        const newMode = await this.mode.jumpToSubject(subjectName);

        if (newMode === undefined) return;

        this.clearSelections();
        this.mode = newMode;

        this.setUI();
        this.mode.fixSelection();

        this.setDecorations();
    }
}
