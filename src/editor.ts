import * as vscode from "vscode";
import { Point } from "./common";

export function scrollEditor(direction: "up" | "down", lines: number) {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const existingRange = editor.visibleRanges[0];

  const lineToReveal =
    direction === "up"
      ? Math.max(existingRange.start.line - lines, 0)
      : Math.min(existingRange.end.line + lines, editor.document.lineCount - 1);

  const newRange = new vscode.Range(lineToReveal, 0, lineToReveal, 0);

  editor.revealRange(newRange);
}

export function moveCursorTo(newPosition: Point, scrollEditor = true) {
  const editor = getEditor();
  const currentPosition = getCursorPosition();

  const newPosition1 = new vscode.Position(
    newPosition.line,
    newPosition.character
  );

  editor.selection = new vscode.Selection(newPosition1, newPosition1);

  if (scrollEditor) {
    scrollToCursorAtCenterIfNearEdge();
  } else {
    editor.revealRange(new vscode.Range(newPosition1, currentPosition));
  }
}

export function getEditor() {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    throw new Error("No active editor");
  }

  return editor;
}

export function selectTo(fromPosition: Point, to: Point) {
  const editor = getEditor();

  editor.selection = new vscode.Selection(
    to.line,
    to.character,
    fromPosition.line,
    fromPosition.character
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

export function getNonActiveSelectionPoint() {
  const editor = getEditor();

  return editor.selection.anchor;
}

export function tryGetLineAt(lineNumber: number) {
  const editor = getEditor();

  if (lineNumber >= editor.document.lineCount) return;

  return editor.document.lineAt(lineNumber);
}

export function getCursorPosition() {
  const editor = getEditor();

  return editor.selection.active;
}
