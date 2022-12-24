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
            return { label: `[${e.quickKey}] ${e.label}` };
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

export function inputBoxChar(
    placeholder?: string
): Promise<string | undefined> {
    return new Promise((resolve) => {
        const inputBox = vscode.window.createInputBox();

        inputBox.placeholder = placeholder;

        inputBox.onDidChangeValue((ch) => {
            resolve(ch);
            inputBox.dispose();
        });

        inputBox.onDidHide(() => {
            resolve(undefined);
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

export function move(
    document: vscode.TextDocument,
    textEditorEdit: vscode.TextEditorEdit,
    rangeToMove: vscode.Range,
    newLocation: vscode.Position
) {
    const textToMove = document.getText(rangeToMove);

    textEditorEdit.delete(rangeToMove);
    textEditorEdit.insert(newLocation, textToMove);
}

export function goToLine(editor: vscode.TextEditor, lineNumber: number) {
    editor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 0);
}

export function scrollToCursorAtCenter(editor: vscode.TextEditor) {
    editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
}

export function charAt(
    document: vscode.TextDocument,
    position: vscode.Position
): string {
    return document.getText(
        new vscode.Range(position, position.translate(0, 1))
    );
}
