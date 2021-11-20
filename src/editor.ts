import * as vscode from "vscode";

export function moveCursorTo(lineNumber: number, column: number) {
  const editor = getEditor();
  const currentPosition = getCursorPosition()!;

  if (!editor) return;

  const position = new vscode.Position(lineNumber, column);
  editor.selection = new vscode.Selection(position, position);

  editor.revealRange(new vscode.Range(position, currentPosition));
}

export function getEditor() {
  return vscode.window.activeTextEditor;
}

export function moveCursorToBeginningOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  moveCursorTo(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
}

export function selectToBeginningOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  const currentPosition = getCursorPosition()!;
  const position = new vscode.Position(line.lineNumber, 0);

  editor.selection = new vscode.Selection(position, currentPosition);
}

export function moveCursorToNextBlankLine(advance: (n: number) => number) {
  const currentPosition = getCursorPosition()!;

  let nextLine = tryGetLineAt(advance(currentPosition.line));

  while (nextLine && !nextLine.isEmptyOrWhitespace) {
    nextLine = tryGetLineAt(advance(nextLine.lineNumber));
  }

  if (nextLine) {
    moveCursorTo(nextLine.lineNumber, 0);
  }
}

function tryGetLineAt(lineNumber: number) {
  const editor = getEditor();

  if (!editor) return;
  if (lineNumber < 0) return;
  if (lineNumber >= editor.document.lineCount) return;

  return editor.document.lineAt(lineNumber);
}

export function moveCursorToEndOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  if (!editor) return;

  moveCursorTo(line.lineNumber, line.range.end.character);
}

export function getCursorPosition() {
  const editor = getEditor();

  if (!editor) return;

  if (editor.selection.isEmpty) {
    return editor.selection.active;
  }
}
