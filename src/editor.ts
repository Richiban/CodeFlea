import * as vscode from "vscode";
import { Point } from "./common";

export function scrollEditor(direction: "up" | "down", lines: number) {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        return;
    }

    const existingRange = editor.visibleRanges[0];

    const lineToReveal =
        direction === "up"
            ? Math.max(existingRange.start.line - lines, 0)
            : Math.min(
                  existingRange.end.line + lines,
                  editor.document.lineCount - 1
              );

    const newRange = new vscode.Range(lineToReveal, 0, lineToReveal, 0);

    editor.revealRange(newRange);
}

export function moveCursorTo(newPosition: Point, scrollEditor = false) {
    const editor = getEditor();
    const currentPosition = getCursorPosition();

    editor.selection = new vscode.Selection(
        newPosition.line,
        newPosition.character,
        newPosition.line,
        newPosition.character
    );

    if (scrollEditor) {
        scrollToReveal(newPosition, currentPosition);
    }
}

export function scrollToReveal(startPosition: Point, endPosition: Point) {
    const editor = getEditor();

    editor.revealRange(
        new vscode.Range(
            startPosition.line,
            startPosition.character,
            endPosition.line,
            endPosition.character
        )
    );
}

export function getEditor() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        throw new Error("No active editor");
    }

    return editor;
}

export function select(fromPosition: Point, to: Point) {
    const editor = getEditor();

    editor.selection = new vscode.Selection(
        fromPosition.line,
        fromPosition.character,
        to.line,
        to.character
    );

    editor.revealRange(
        new vscode.Range(
            to.line,
            to.character,
            fromPosition.line,
            fromPosition.character
        )
    );
}

export function scrollToCursorAtCenter() {
    const editor = getEditor();

    const cursorPosition = getCursorPosition();

    const viewportHeight =
        editor.visibleRanges[0].end.line - editor.visibleRanges[0].start.line;

    const rangeToReveal = new vscode.Range(
        Math.max(0, cursorPosition.line - viewportHeight / 2),
        0,
        Math.min(
            editor.document.lineCount - 1,
            cursorPosition.line + viewportHeight / 2
        ),
        0
    );

    editor.revealRange(rangeToReveal);
}

export function getNonActiveSelectionPoint() {
    const editor = getEditor();

    return editor.selection.anchor;
}

export function tryGetLineAt(lineNumber: number) {
    const editor = getEditor();

    if (lineNumber >= editor.document.lineCount) return;

    return editor.document.lineAt(lineNumber);
}

export function getCursorPosition(): Point {
    const editor = getEditor();

    return editor.selection.active;
}

export type EditorModeName = "EDIT" | "NAVIGATE" | "EXTEND";

export type SelectionMode = "Word" | "Line" | "Block";

export type EditorMode = {
    changeTo(newMode: EditorModeName): EditorMode;
    updateStatusBar(statusBar: vscode.StatusBarItem): void;
    onCharTyped(char: string): EditorMode;
};

class NavigateMode implements EditorMode {
    constructor(
        private keySequence: string,
        public selectionMode: SelectionMode
    ) {}

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return new EditMode(this.keySequence, this);
            case "EXTEND":
                return new ExtendMode(this.keySequence, this);
            case "NAVIGATE":
                return this;
        }
    }

    onCharTyped(char: string): EditorMode {
        return this;
    }

    updateStatusBar(statusBar: vscode.StatusBarItem) {
        statusBar.text = `Ⓜ️ Navigate (${this.selectionMode})`;
        statusBar.show();
    }
}

class ExtendMode implements EditorMode {
    constructor(
        private keySequence: string,
        private previousNavigateMode: NavigateMode
    ) {}

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return new EditMode(
                    this.keySequence,
                    this.previousNavigateMode
                );
            case "EXTEND":
                return this;
            case "NAVIGATE":
                return this.previousNavigateMode;
        }
    }

    onCharTyped(char: string): EditorMode {
        return this;
    }

    updateStatusBar(statusBar: vscode.StatusBarItem) {
        statusBar.text = `Extend (${this.previousNavigateMode.selectionMode})`;
        statusBar.show();
    }
}

class EditMode implements EditorMode {
    private keySequenceStarted: boolean = false;

    constructor(
        private navigateKeySequence: string,
        private previousNavigateMode: NavigateMode
    ) {}

    changeTo(newMode: EditorModeName): EditorMode {
        switch (newMode) {
            case "EDIT":
                return this;
            case "EXTEND":
                return new ExtendMode(
                    this.navigateKeySequence,
                    this.previousNavigateMode
                );
            case "NAVIGATE":
                return this.previousNavigateMode;
        }
    }

    onCharTyped(char: string): EditorMode {
        if (this.keySequenceStarted) {
            if (char === this.navigateKeySequence[1]) {
                return this.previousNavigateMode;
            } else {
                this.keySequenceStarted = false;

                vscode.commands.executeCommand("default:type", {
                    text: `${this.navigateKeySequence[0]}${char}`,
                });
            }
        } else {
            if (char === this.navigateKeySequence[0]) {
                this.keySequenceStarted = true;
            } else {
                this.keySequenceStarted = false;

                vscode.commands.executeCommand("default:type", {
                    text: char,
                });
            }
        }

        return this;
    }

    updateStatusBar(statusBar: vscode.StatusBarItem) {
        statusBar.text = `Edit`;
        statusBar.show();
    }
}

export class EditorManager {
    private mode: EditorMode = new NavigateMode("ne", "Word");
    private statusbar: vscode.StatusBarItem;
    private editor: vscode.TextEditor | undefined;

    constructor() {
        this.statusbar = vscode.window.createStatusBarItem(
            "codeflea",
            vscode.StatusBarAlignment.Left,
            0
        );
    }

    setEditor(editor: vscode.TextEditor | undefined) {
        this.editor = editor;
    }

    changeMode(newMode: EditorModeName) {
        this.mode = this.mode.changeTo(newMode);
        this.mode.updateStatusBar(this.statusbar);

        vscode.commands.executeCommand(
            "setContext",
            "codeflea-vscode.state",
            newMode
        );
    }

    onCharTyped(char: string) {
        this.mode = this.mode.onCharTyped(char);
    }
}
