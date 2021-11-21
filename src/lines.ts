import { relative } from "path";
import * as vscode from "vscode";
import {
  Change,
  Direction,
  Indentation,
  DirectionOrNearest,
  linqish,
} from "./common";
import {
  getCursorPosition,
  getEditor,
  getNonActiveSelectionPoint,
  moveCursorToBeginningOfLine,
  selectToBeginningOfLine,
  tryGetLineAt,
} from "./editor";

export function lineIsMeaningless(line: vscode.TextLine) {
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
  if (lineIsLastInFile(currentLine)) return true;
  if (lineIsMeaningless(currentLine)) return false;
  if (!prevLine) return true;

  return (
    lineIsIndentationChange(prevLine, currentLine) ||
    lineIsMeaningless(prevLine)
  );
}

function lineIsLastInFile(line: vscode.TextLine) {
  return line.lineNumber === getEditor().document.lineCount - 1;
}

function fromDirection(direction: Direction) {
  return direction === "forwards" ? (x: number) => x + 1 : (x: number) => x - 1;
}

type Bounds = { start: { line: number }; end: { line: number } };

function* iterLinesWithPrevious(
  document: vscode.TextDocument,
  currentLineNumber: number,
  direction: Direction,
  bounds: Bounds = { start: { line: 0 }, end: { line: document.lineCount } }
) {
  const advance = fromDirection(direction);
  currentLineNumber = advance(currentLineNumber);

  const inBounds = (num: number) => {
    return num >= bounds.start.line && num < bounds.end.line;
  };

  while (inBounds(currentLineNumber)) {
    const prevLine =
      currentLineNumber === 0
        ? undefined
        : document.lineAt(currentLineNumber - 1);
    const currentLine = document.lineAt(currentLineNumber);

    yield { prevLine, currentLine };

    currentLineNumber = advance(currentLineNumber);
  }
}

export function* iterLines(
  document: vscode.TextDocument,
  currentLineNumber: number,
  direction: Direction,
  skipCurrent = true
) {
  const advance = fromDirection(direction);

  if (skipCurrent) currentLineNumber = advance(currentLineNumber);

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

export function getNearestLineOfChangeOfIndentation(
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

export function moveCursorToNextBlankLine(advance: (n: number) => number) {
  const currentPosition = getCursorPosition()!;

  let nextLine = tryGetLineAt(advance(currentPosition.line));

  while (nextLine && !nextLine.isEmptyOrWhitespace) {
    nextLine = tryGetLineAt(advance(nextLine.lineNumber));
  }

  if (nextLine) {
    moveCursorToBeginningOfLine(nextLine);
  }
}

export function moveToChangeOfIndentation(
  change: Change,
  direction: DirectionOrNearest
) {
  const cursorPosition = getCursorPosition();
  const document = getEditor()?.document;

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

    if (line) moveCursorToBeginningOfLine(line);
  }
}

export function* getNextBlocks(
  fromPosition: vscode.Position,
  direction: Direction
) {
  const document = getEditor()?.document;

  if (fromPosition && document) {
    const documentLines = iterLinesWithPrevious(
      document,
      fromPosition.line,
      direction
    );

    for (const { prevLine, currentLine } of documentLines) {
      if (lineIsInteresting(prevLine, currentLine)) {
        yield currentLine;
      }
    }
  }
}

export type LineEnumerationPattern = "alternate" | "sequential";

export function getBlocks(
  pattern: LineEnumerationPattern,
  direction: Direction,
  bounds: vscode.Range
) {
  const cursorPosition = getCursorPosition();
  const document = getEditor()?.document;

  if (!document || !cursorPosition) return linqish.empty;

  const linesForwards = iterLinesWithPrevious(
    document,
    cursorPosition.line,
    "forwards",
    bounds
  );

  const linesBackwards = iterLinesWithPrevious(
    document,
    cursorPosition.line,
    "backwards",
    bounds
  );

  const [a, b] =
    direction === "forwards"
      ? [linesForwards, linesBackwards]
      : [linesBackwards, linesForwards];

  switch (pattern) {
    case "alternate":
      return linqish(a)
        .alternateWith(b)
        .filter(({ prevLine, currentLine }) =>
          lineIsInteresting(prevLine, currentLine)
        )
        .map(({ prevLine: _, currentLine }) => currentLine);
    case "sequential":
      return linqish(a)
        .concat(b)
        .filter(({ prevLine, currentLine }) =>
          lineIsInteresting(prevLine, currentLine)
        )
        .map(({ prevLine: _, currentLine }) => currentLine);
  }
}

export function extendBlockSelection(
  direction: Direction,
  indentation: Indentation
) {
  if (indentation !== "same-indentation") {
    throw new Error("Only 'same-indentation' is currently supported");
  }

  const editor = getEditor();
  const cursorPosition = getCursorPosition();

  const continuationPoint = editor.selection.anchor;

  const x = getRelativeIndentation(
    editor.document.lineAt(continuationPoint.line)
  );

  for (const line of getNextBlocks(continuationPoint, direction)) {
    const relativeIndentation = getRelativeIndentation(line);

    if (relativeIndentation === "less-indentation") {
      break;
    }

    if (relativeIndentation === "same-indentation") {
      selectToBeginningOfLine(cursorPosition, line);
      return;
    }
  }

  if (x === "less-indentation") {
    return;
  }

  for (const line of iterLines(
    editor.document,
    continuationPoint.line,
    direction
  )) {
    const relativeIndentation = getRelativeIndentation(line);

    if (relativeIndentation === "less-indentation") {
      selectToBeginningOfLine(cursorPosition, line);
      return;
    }
  }
}

export function moveToNextBlankLine(direction: Direction) {
  if (direction === "forwards") {
    moveCursorToNextBlankLine((x) => x + 1);
  } else {
    moveCursorToNextBlankLine((x) => x - 1);
  }
}

export function moveToNextBlock(
  direction: Direction,
  indentation: Indentation
) {
  const cursorPosition = getCursorPosition();

  for (const line of getNextBlocks(cursorPosition, direction)) {
    if (
      indentation === "any-indentation" ||
      indentation === getRelativeIndentation(line)
    ) {
      moveCursorToBeginningOfLine(line);

      return;
    }
  }
}

function getRelativeIndentation(targetLine: vscode.TextLine): Indentation {
  const editor = getEditor();

  const document = editor.document;

  const cursorPosition = getCursorPosition();
  const currentLine = document.lineAt(cursorPosition.line);

  if (
    currentLine.firstNonWhitespaceCharacterIndex >
    targetLine.firstNonWhitespaceCharacterIndex
  ) {
    return "less-indentation";
  }

  if (
    currentLine.firstNonWhitespaceCharacterIndex <
    targetLine.firstNonWhitespaceCharacterIndex
  ) {
    return "greater-indentation";
  }

  return "same-indentation";
}

export function moveToLineOfSameIndentation(direction: Direction) {
  const cursorPosition = getCursorPosition();
  const document = getEditor().document;

  if (cursorPosition && document) {
    const documentLines = iterLines(document, cursorPosition.line, direction);

    const currentLine = document.lineAt(cursorPosition.line);

    for (const line of documentLines) {
      if (
        currentLine.firstNonWhitespaceCharacterIndex ===
          line.firstNonWhitespaceCharacterIndex &&
        !line.isEmptyOrWhitespace
      ) {
        moveCursorToBeginningOfLine(line);
        break;
      }
    }
  }
}
