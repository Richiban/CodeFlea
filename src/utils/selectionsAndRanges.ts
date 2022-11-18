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
    if (editor) {
        editor.selections = editor.selections.map(mapper);
    }
}

export function flatMap(
    editor: vscode.TextEditor,
    mapper: (selection: vscode.Selection) => vscode.Selection[]
) {
    if (editor) {
        editor.selections = editor.selections.flatMap(mapper);
    }
}

export function expandToIncludeBlankLines(
    editor: vscode.TextEditor,
    range: vscode.Range
): vscode.Range {
    let startLine = range.start.line;
    let endLine = range.end.line;

    if (
        startLine > 0 &&
        editor.document.lineAt(startLine - 1).isEmptyOrWhitespace
    ) {
        startLine--;
    }

    if (
        endLine < editor.document.lineCount - 1 &&
        editor.document.lineAt(endLine + 1).isEmptyOrWhitespace
    ) {
        endLine++;
    }

    const testRange = editor.document.lineAt(startLine).range;

    return new vscode.Range(
        startLine,
        editor.document.lineAt(startLine).firstNonWhitespaceCharacterIndex,
        endLine,
        editor.document.lineAt(endLine).rangeIncludingLineBreak.end.character
    );
}
