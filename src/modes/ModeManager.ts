import * as vscode from "vscode";
import { Config } from "../config";
import { NullMode } from "./NullMode";
import { EditorMode, EditorModeType } from "./modes";
import { SubjectActions } from "../subjects/subjects";
import { quickPicker, scrollToCursorAtCenter } from "../editor";

type GoToCommand = keyof typeof GoToCommands;

const GoToCommands = {
    async topOfFile() {
        await vscode.commands.executeCommand("cursorTop");
    },
    async bottomOfFile() {
        await vscode.commands.executeCommand("cursorBottom");
    },
    async typeDefinition() {
        await vscode.commands.executeCommand(
            "editor.action.goToTypeDefinition"
        );
    },
    async implementation() {
        await vscode.commands.executeCommand(
            "editor.action.goToImplementation"
        );
    },
    async references() {
        await vscode.commands.executeCommand("editor.action.goToReferences");
    },
};

type SpaceCommand = keyof typeof SpaceCommands;

const SpaceCommands = {
    async centerEditor() {
        scrollToCursorAtCenter();
    },
    async openBreadcrumbs() {
        await vscode.commands.executeCommand("breadcrumbs.focusAndSelect");
    },
    async formatDocument() {
        await vscode.commands.executeCommand("editor.action.formatDocument");
    },
    async rename() {
        await vscode.commands.executeCommand("editor.action.rename");
    },
    async toToSymbolInFile() {
        await vscode.commands.executeCommand("workbench.action.gotoSymbol");
    },
    async toToSymbolInWorkspace() {
        await vscode.commands.executeCommand("workbench.action.showAllSymbols");
    },
    async showHover() {
        await vscode.commands.executeCommand("editor.action.showHover");
    },
};

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
        await this.mode.executeSubjectCommand(command);
    }

    async repeatSubjectCommand() {
        await this.mode.repeatSubjectCommand();
    }

    onCharTyped(typed: { text: string }) {
        this.mode = this.mode.onCharTyped(typed);

        this.mode.refreshUI(this);
    }

    async openSpaceMenu() {
        const choice = await quickPicker<SpaceCommand>([
            {
                quickKey: " ",
                label: "center editor",
                command: "centerEditor",
            },
            {
                quickKey: "b",
                label: "open breadcrumbs",
                command: "openBreadcrumbs",
            },
            {
                quickKey: "f",
                label: "format document",
                command: "formatDocument",
            },
            {
                quickKey: "r",
                label: "rename",
                command: "rename",
            },
            {
                quickKey: "s",
                label: "Open VS Codes's Go to Symbol in Editor",
                command: "toToSymbolInFile",
            },
            {
                quickKey: "S",
                label: "Open VS Codes's Go to Symbol in Workspace",
                command: "toToSymbolInWorkspace",
            },
            {
                quickKey: "h",
                label: "Show Definition Preview Hover.",
                command: "showHover",
            },
        ]);

        if (choice) {
            await SpaceCommands[choice]();
        }
    }

    async openGoToMenu() {
        const choice = await quickPicker<GoToCommand>([
            {
                quickKey: "u",
                label: "top of file",
                command: "topOfFile",
            },
            {
                quickKey: "e",
                label: "bottom of file",
                command: "bottomOfFile",
            },
            {
                quickKey: "t",
                label: "go to type definition",
                command: "typeDefinition",
            },
            {
                quickKey: "i",
                label: "go to implementation",
                command: "implementation",
            },
            {
                quickKey: "r",
                label: "find references",
                command: "references",
            },
        ]);

        if (choice) {
            await GoToCommands[choice]();
        }
    }
}
