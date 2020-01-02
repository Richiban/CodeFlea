import * as vscode from "vscode";
import editor from "./editor";
import { Change, Direction, DirectionOrNearest } from "./common";

function lineIsBoring(line: vscode.TextLine) {
  return !/[a-zA-Z0-9]/.test(line.text);
}

function lineIsIndentationChange(
  prevLine: vscode.TextLine,
  currentLine: vscode.TextLine
) {
  return (
    prevLine.firstNonWhitespaceCharacterIndex !==
    currentLine.firstNonWhitespaceCharacterIndex
  );
}

function lineIsInteresting(
  prevLine: vscode.TextLine | undefined,
  currentLine: vscode.TextLine
) {
  if (lineIsBoring(currentLine)) return false;
  if (!prevLine) return true;

  return (
    lineIsIndentationChange(prevLine, currentLine) || lineIsBoring(prevLine)
  );
}

function fromDirection(direction: Direction) {
  return direction === "forwards" ? (x: number) => x + 1 : (x: number) => x - 1;
}

function* iterLinesWithPrevious(
  document: vscode.TextDocument,
  currentLineNumber: number,
  direction: Direction
) {
  const advance = fromDirection(direction);
  currentLineNumber = advance(currentLineNumber);

  while (withinBounds()) {
    const prevLine =
      currentLineNumber === 0
        ? undefined
        : document.lineAt(currentLineNumber - 1);
    const currentLine = document.lineAt(currentLineNumber);

    yield { prevLine, currentLine };

    currentLineNumber = advance(currentLineNumber);
  }

  function withinBounds() {
    return currentLineNumber >= 0 && currentLineNumber < document.lineCount;
  }
}

function* iterLines(
  document: vscode.TextDocument,
  currentLineNumber: number,
  direction: Direction
) {
  const advance = fromDirection(direction);
  currentLineNumber = advance(currentLineNumber);

  while (withinBounds()) {
    yield document.lineAt(currentLineNumber);

    currentLineNumber = advance(currentLineNumber);
  }

  function withinBounds() {
    return currentLineNumber >= 0 && currentLineNumber < document.lineCount;
  }
}

function* iterLinesOutwards(
  document: vscode.TextDocument,
  currentLineNumber: number
) {
  let forwardsPointer = currentLineNumber + 1;
  let backwardsPointer = currentLineNumber - 1;

  while (forwardsPointerInBounds() && backwardsPointerInBounds()) {
    const backwardsLine = backwardsPointerInBounds()
      ? document.lineAt(backwardsPointer)
      : undefined;
    const forwardsLine = forwardsPointerInBounds()
      ? document.lineAt(forwardsPointer)
      : undefined;

    yield { backwardsLine, forwardsLine };

    forwardsPointer++;
    backwardsPointer--;
  }

  function forwardsPointerInBounds() {
    return forwardsPointer <= document.lineCount;
  }

  function backwardsPointerInBounds() {
    return backwardsPointer >= 0;
  }
}

function toDiff(change: Change) {
  if (change === "greaterThan") return (x: number, y: number) => x > y;
  return (x: number, y: number) => x < y;
}

function getNearestLineOfChangeOfIndentation(
  document: vscode.TextDocument,
  currentLine: vscode.TextLine,
  change: Change
) {
  const diff = toDiff(change);

  for (const { backwardsLine, forwardsLine } of iterLinesOutwards(
    document,
    currentLine.lineNumber
  )) {
    if (
      forwardsLine &&
      !forwardsLine.isEmptyOrWhitespace &&
      diff(
        forwardsLine.firstNonWhitespaceCharacterIndex,
        currentLine.firstNonWhitespaceCharacterIndex
      )
    )
      return forwardsLine;

    if (
      backwardsLine &&
      !backwardsLine.isEmptyOrWhitespace &&
      diff(
        backwardsLine.firstNonWhitespaceCharacterIndex,
        currentLine.firstNonWhitespaceCharacterIndex
      )
    )
      return backwardsLine;
  }
}

export function getNextLineOfChangeOfIndentation(
  change: Change,
  direction: Direction,
  document: vscode.TextDocument,
  currentLine: vscode.TextLine
) {
  const diff = toDiff(change);

  for (const line of iterLines(document, currentLine.lineNumber, direction)) {
    if (
      line &&
      !line.isEmptyOrWhitespace &&
      diff(
        line.firstNonWhitespaceCharacterIndex,
        currentLine.firstNonWhitespaceCharacterIndex
      )
    )
      return line;
  }
}

export function moveToChangeOfIndentation(
  change: Change,
  direction: DirectionOrNearest
) {
  const cursorPosition = editor.getCursorPosition();
  const document = editor.getDocument();

  if (cursorPosition && document) {
    let line: vscode.TextLine | undefined;
    const currentLine = document.lineAt(cursorPosition.line);

    switch (direction) {
      case "nearest": {
        line = getNearestLineOfChangeOfIndentation(
          document,
          document.lineAt(cursorPosition.line),
          change
        );
        break;
      }
      case "backwards":
      case "forwards": {
        line = getNextLineOfChangeOfIndentation(
          change,
          direction,
          document,
          currentLine
        );
        break;
      }
    }

    if (line) editor.moveCursorToBeginningOfLine(line);
  }
}

function moveToNextInterestingLine(direction: Direction) {
  const cursorPosition = editor.getCursorPosition();
  const document = editor.getDocument();

  if (cursorPosition && document) {
    const documentLines = iterLinesWithPrevious(
      document,
      cursorPosition.line,
      direction
    );

    for (const { prevLine, currentLine } of documentLines) {
      if (lineIsInteresting(prevLine, currentLine)) {
        editor.moveCursorToBeginningOfLine(currentLine);
        break;
      }
    }
  }
}

function moveToLineOfSameIndentation(direction: Direction) {
  const cursorPosition = editor.getCursorPosition();
  const document = editor.getDocument();

  if (cursorPosition && document) {
    const documentLines = iterLines(document, cursorPosition.line, direction);

    const currentLine = document.lineAt(cursorPosition.line);

    for (const line of documentLines) {
      if (
        currentLine.firstNonWhitespaceCharacterIndex ===
          line.firstNonWhitespaceCharacterIndex &&
        !line.isEmptyOrWhitespace
      ) {
        editor.moveCursorToBeginningOfLine(line);
        break;
      }
    }
  }
}

export default {
  moveToLineOfSameIndentation,
  moveToChangeOfIndentation,
  moveToNextInterestingLine
};
