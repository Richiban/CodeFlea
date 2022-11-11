import * as vscode from "vscode";
import { QuickCommand } from "./quickMenus";

export function quickCommandPicker(
    commands: QuickCommand[],
    options: { allowFreeEntry: true }
): Promise<QuickCommand | string | undefined>;
export function quickCommandPicker(
    commands: QuickCommand[],
    options: { allowFreeEntry: false }
): Promise<QuickCommand | undefined>;
export function quickCommandPicker(
    commands: QuickCommand[],
    options: { allowFreeEntry: boolean }
): Promise<QuickCommand | string | undefined> {
    return new Promise((resolve, reject) => {
        const quickPick = vscode.window.createQuickPick();

        quickPick.items = commands.map((e) => {
            return { label: `(${e.quickKey}) ${e.label}` };
        });

        quickPick.onDidHide(() => {
            resolve(undefined);
            quickPick.dispose();
        });

        quickPick.onDidChangeValue((e) => {
            for (const option of commands) {
                if (option.quickKey === e) {
                    resolve(option);
                    quickPick.dispose();
                    return;
                }
            }

            if (!options.allowFreeEntry) {
                quickPick.value = "";
            }
        });

        quickPick.onDidAccept(() => {
            if (options.allowFreeEntry) {
                resolve(quickPick.value);
            } else {
                reject();
            }

            quickPick.dispose();
        });

        quickPick.show();
    });
}

export function inputBoxChar(placeholder?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const inputBox = vscode.window.createInputBox();

        inputBox.placeholder = placeholder;

        inputBox.onDidChangeValue((ch) => {
            resolve(ch);
            inputBox.dispose();
        });

        inputBox.onDidHide(() => {
            reject();
            inputBox.dispose();
        });

        inputBox.show();
    });
}

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

export function moveCursorTo(
    newPosition: vscode.Position,
    scrollEditor = false
) {
    const editor = getEditor();
    const currentPosition = editor.selection.active;

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

export function swap(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    origin: vscode.Range,
    target: vscode.Range
) {
    const originalText = document.getText(origin);
    const targetText = document.getText(target);

    edit.replace(target, originalText);
    edit.replace(origin, targetText);

    return target;
}

export function goToLine(lineNumber: number) {
    const editor = getEditor();

    editor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
}

export function scrollToReveal(
    startPosition: vscode.Position,
    endPosition: vscode.Position
) {
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

export function select(fromPosition: vscode.Position, to: vscode.Position) {
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
    const cursorPosition = editor.selection.active;

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

    if (lineNumber >= editor.document.lineCount) {
        return;
    }

    return editor.document.lineAt(lineNumber);
}
