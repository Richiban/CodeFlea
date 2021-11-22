import * as vscode from "vscode";

export function moveCursorTo(
  lineNumber: number,
  column: number,
  scrollEditor = true
) {
  const editor = getEditor();
  const currentPosition = getCursorPosition();

  const newPosition = new vscode.Position(lineNumber, column);
  editor.selection = new vscode.Selection(newPosition, newPosition);

  if (scrollEditor) {
    scrollToCursorAtCenterIfNearEdge();
  } else {
    editor.revealRange(new vscode.Range(newPosition, currentPosition));
  }
}

export function getEditor() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    throw new Error("No active editor");
  }

  return editor;
}

export function moveCursorToBeginningOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  moveCursorTo(line.lineNumber, line.firstNonWhitespaceCharacterIndex);
}

export function selectToBeginningOfLine(
  fromPosition: vscode.Position,
  line: vscode.TextLine
) {
  const editor = getEditor();

  const position = new vscode.Position(line.lineNumber, 0);

  editor.selection = new vscode.Selection(position, fromPosition);

  editor.revealRange(new vscode.Range(position, fromPosition));
}

export function scrollToCursorAtCenterIfNearEdge() {
  const editor = getEditor();
  const cursorPosition = getCursorPosition();
  const visibleRange = editor.visibleRanges[0];
  const numVisibleLines = visibleRange.end.line - visibleRange.start.line;
  const boundarySize = numVisibleLines / 4;
  const lowerBound = visibleRange.start.line + boundarySize;
  const upperBound = visibleRange.end.line - boundarySize;

  if (cursorPosition.line < lowerBound || cursorPosition.line > upperBound) {
    scrollToCursorAtCenter();
  }
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

export function selectToEndOfLine(
  fromPosition: vscode.Position,
  line: vscode.TextLine
) {
  const editor = getEditor();

  const position = new vscode.Position(line.lineNumber, line.text.length);

  editor.selection = new vscode.Selection(position, fromPosition);

  editor.revealRange(new vscode.Range(fromPosition, position));
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

export function moveCursorToEndOfLine(line: vscode.TextLine) {
  const editor = getEditor();

  moveCursorTo(line.lineNumber, line.range.end.character);
}

export function getCursorPosition() {
  const editor = getEditor();

  return editor.selection.active;
}
