import * as vscode from "vscode";

function moveCursorTo(lineNumber: number, column: number) {
  const editor = getEditor();

  if (!editor) return;

  editor.selection = new vscode.Selection(
    new vscode.Position(lineNumber, column),
    new vscode.Position(lineNumber, column)
  );
}

function getEditor() {
  return vscode.window.activeTextEditor;
}

function getDocument() {
  return getEditor()?.document;
}

function moveCursorToBeginningOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  editor.selection = new vscode.Selection(
    new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
    new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex)
  );
}

function moveCursorToEndOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  editor.selection = new vscode.Selection(
    new vscode.Position(line.lineNumber, line.range.end.character),
    new vscode.Position(line.lineNumber, line.range.end.character)
  );
}

function getCursorPosition() {
  const editor = getEditor();

  if (!editor) return;

  if (editor.selection.isEmpty) {
    return editor.selection.active;
  }
}

export default {
  moveCursorToBeginningOfLine,
  moveCursorToEndOfLine,
  moveCursorTo,
  getCursorPosition,
  getDocument
};
