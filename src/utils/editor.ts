import * as vscode from "vscode";
import { char, QuickCommand } from "./quickMenus";
import * as common from "../common";

export function quickCommandPicker(
    commands: QuickCommand[]
): Promise<QuickCommand | undefined>;

export function quickCommandPicker(
    commands: QuickCommand[],
    freeEntryOptions: { label: string; detail: string }
): Promise<QuickCommand | string | undefined>;

export function quickCommandPicker(
    commands: QuickCommand[],
    freeEntryOptions?: { label: string; detail: string }
): Promise<QuickCommand | string | undefined> {
    return new Promise((resolve, reject) => {
        type QuickPickItem = vscode.QuickPickItem & {
            quickKey?: common.Char;
            displayOnly?: true;
        };

        const quickPick = vscode.window.createQuickPick<QuickPickItem>();

        const freeEntryItems = freeEntryOptions
            ? [
                  {
                      label: "",
                      kind: vscode.QuickPickItemKind.Separator,
                      displayOnly: true,
                  },
                  {
                      label: freeEntryOptions.label,
                      alwaysShow: true,
                      detail: freeEntryOptions.detail,
                      displayOnly: true,
                  },
              ]
            : [];

        quickPick.items = commands
            .map<vscode.QuickPickItem>((e) => {
                return {
                    quickKey: e.quickKey,
                    label: `[${e.quickKey}]`,
                    description: e.label,
                    execute: e.execute,
                };
            })
            .concat(...freeEntryItems);

        quickPick.onDidHide(() => {
            resolve(undefined);
            quickPick.dispose();
        });

        quickPick.onDidChangeValue((s) => {
            for (const option of commands) {
                if (option.quickKey === s) {
                    resolve(option);
                    quickPick.dispose();
                    return;
                }
            }

            if (!freeEntryOptions) {
                quickPick.value = "";
            }
        });

        quickPick.onDidAccept(() => {
            const selected = quickPick.selectedItems[0];

            if (selected.displayOnly) {
                if (quickPick.value) {
                    resolve(quickPick.value);
                } else {
                    return;
                }
            }

            for (const option of commands) {
                if (option.quickKey === selected.quickKey) {
                    resolve(option);
                    quickPick.dispose();
                    return;
                }
            }

            quickPick.dispose();
        });

        quickPick.show();
    });
}

export function inputBoxChar(
    placeholder?: string,
    allowEmpty = false
): Promise<common.Char | undefined> {
    return new Promise((resolve) => {
        const inputBox = vscode.window.createInputBox();

        inputBox.placeholder = placeholder;

        inputBox.onDidChangeValue((ch) => {
            resolve(ch[0] as common.Char);
            inputBox.dispose();
        });

        inputBox.onDidAccept(() => {
            if (!allowEmpty) {
                return;
            }
            resolve(undefined);
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
