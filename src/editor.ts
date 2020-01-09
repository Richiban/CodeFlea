import * as vscode from "vscode";

export function moveCursorTo(lineNumber: number, column: number) {
  const editor = getEditor();

  if (!editor) return;

  const position = new vscode.Position(lineNumber, column);

  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenter
  );
}

export function getEditor() {
  return vscode.window.activeTextEditor;
}

export function moveCursorToBeginningOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  editor.selection = new vscode.Selection(
    new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
    new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex)
  );
}

export function moveCursorToEndOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  editor.selection = new vscode.Selection(
    new vscode.Position(line.lineNumber, line.range.end.character),
    new vscode.Position(line.lineNumber, line.range.end.character)
  );
}

export function getCursorPosition() {
  const editor = getEditor();

  if (!editor) return;

  if (editor.selection.isEmpty) {
    return editor.selection.active;
  }
}
