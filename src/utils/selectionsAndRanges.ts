import * as vscode from "vscode";

export type SelectionEndType = keyof Pick<vscode.Selection, "start" | "end">;

export function getMidPoint(range: vscode.Range): vscode.Position {
    return new vscode.Position(
        range.start.line + Math.floor((range.end.line - range.start.line) / 2),
        range.start.character +
            Math.floor((range.end.character - range.start.character) / 2)
    );
}

export function collapseSelections(
    editor: vscode.TextEditor,
    endType: SelectionEndType = "start"
) {
    tryMap(
        editor,
        (selection) =>
            new vscode.Selection(selection[endType], selection[endType])
    );
}

export function tryMap(
    editor: vscode.TextEditor,
    mapper: (selection: vscode.Selection) => vscode.Range | undefined
) {
    if (editor) {
        editor.selections = editor.selections.map((selection) => {
            const newSelection = mapper(selection);

            if (!newSelection) {
                return selection;
            } else if (newSelection instanceof vscode.Selection) {
                return newSelection;
            } else {
                return new vscode.Selection(
                    newSelection.start,
                    newSelection.end
                );
            }
        });
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

export function pointToRange(point: vscode.Position): any {
    return new vscode.Range(point, point);
}

export function rangeToSelection(range: vscode.Range): vscode.Selection {
    return new vscode.Selection(range.start, range.end);
}
