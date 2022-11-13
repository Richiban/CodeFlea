import * as vscode from "vscode";

export type SelectionEndType = keyof Pick<vscode.Selection, "start" | "end">;

export function collapseSelections(
    editor: vscode.TextEditor,
    endType: SelectionEndType = "start"
) {
    map(
        editor,
        (selection) =>
            new vscode.Selection(selection[endType], selection[endType])
    );
}

export function map(
    editor: vscode.TextEditor,
    mapper: (selection: vscode.Selection) => vscode.Selection
) {
    editor.selections = editor.selections.map(mapper);
}
