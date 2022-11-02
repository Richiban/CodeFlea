import * as vscode from "vscode";
import { Config, ModesConfig } from "./config";

export type EditorModeName = "EDIT" | "NAVIGATE" | "EXTEND";

export type SubjectType = "WORD" | "LINE" | "BLOCK";

export type EditorMode = {
    changeTo(newMode: EditorModeName): EditorMode;
    refreshUI(editorManager: ModeManager): void;
    onCharTyped(typed: { text: string }): EditorMode;
    changeSubject(subject: SubjectType): void;
};

class NavigateMode implements EditorMode {
    constructor(private config: ModesConfig, public subjectType: SubjectType) {}

    changeSubject(subject: SubjectType): void {
        this.subjectType = subject;
    }

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return new EditMode(this.config, this);
            case "EXTEND":
                return new ExtendMode(this.config, this);
            case "NAVIGATE":
                return this;
        }
    }

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Navigate (${this.subjectType})`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.Block;
            editorManager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "NAVIGATE"
        );
    }
}

class ExtendMode implements EditorMode {
    constructor(
        private config: ModesConfig,
        private previousNavigateMode: NavigateMode
    ) {}

    changeSubject(subject: SubjectType): void {
        this.previousNavigateMode.changeSubject(subject);
    }

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return new EditMode(this.config, this.previousNavigateMode);
            case "EXTEND":
                return this;
            case "NAVIGATE":
                return this.previousNavigateMode;
        }
    }

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Extend (${this.previousNavigateMode.subjectType})`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.BlockOutline;
            editorManager.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        vscode.commands.executeCommand("setContext", "codeFlea.mode", "EXTEND");
    }
}

class EditMode implements EditorMode {
    private keySequenceStarted: boolean = false;

    constructor(
        private config: ModesConfig,
        private previousNavigateMode: NavigateMode
    ) {}

    changeSubject(): void {}

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return this;
            case "EXTEND":
                return new ExtendMode(this.config, this.previousNavigateMode);
            case "NAVIGATE":
                return this.previousNavigateMode;
        }
    }

    onCharTyped(typed: { text: string }): EditorMode {
        console.log(`Edit mode: char typed => ${typed.text}`);

        if (this.keySequenceStarted) {
            if (typed.text === this.config.navigateKeySequence[1]) {
                console.log(`Magic combo pressed; changing to nav mode`);
                return this.previousNavigateMode;
            } else {
                this.keySequenceStarted = false;

                vscode.commands.executeCommand("default:type", {
                    text: `${this.config.navigateKeySequence[0]}${typed.text}`,
                });
            }
        } else {
            if (typed.text === this.config.navigateKeySequence[0]) {
                this.keySequenceStarted = true;
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
}

class NullMode implements EditorMode {
    constructor(private config: Config) {}

    changeSubject(): void {}

    changeTo(newMode: EditorModeName): EditorMode {
        const navigateMode = new NavigateMode(this.config.modes, "WORD");

        switch (newMode) {
            case "EDIT":
                return new EditMode(this.config.modes, navigateMode);
            case "EXTEND":
                return new ExtendMode(this.config.modes, navigateMode);
            case "NAVIGATE":
                return navigateMode;
        }
    }

    refreshUI(editorManager: ModeManager): void {
        editorManager.statusBar.text = `Initialising...`;
    }

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }
}

export class ModeManager {
    private mode: EditorMode;
    public statusBar: vscode.StatusBarItem;
    public editor: vscode.TextEditor | undefined;

    constructor(editor: vscode.TextEditor | undefined, config: Config) {
        this.statusBar = vscode.window.createStatusBarItem(
            "codeFlea",
            vscode.StatusBarAlignment.Left,
            0
        );

        this.mode = new NullMode(config);

        this.editor = editor;
        this.statusBar.show();
    }

    setEditor(editor: vscode.TextEditor | undefined) {
        this.editor = editor;

        this.mode.refreshUI(this);
    }

    changeMode(newMode: "NAVIGATE", subject: SubjectType): void;
    changeMode(newMode: EditorModeName): void;
    changeMode(newMode: EditorModeName, subject?: SubjectType) {
        this.mode = this.mode.changeTo(newMode);

        if (subject) {
            this.mode.changeSubject(subject);
        }

        this.mode.refreshUI(this);
    }

    onCharTyped(typed: { text: string }) {
        this.mode = this.mode.onCharTyped(typed);

        this.mode.refreshUI(this);
    }
}
