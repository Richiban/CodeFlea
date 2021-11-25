import * as vscode from "vscode";
import {
  Change,
  Direction,
  Indentation,
  DirectionOrNearest,
  linqish,
  IndentationRequest,
  opposite,
  Point,
} from "./common";
import {
  getCursorPosition,
  getEditor,
  moveCursorTo,
  selectTo,
  tryGetLineAt,
} from "./editor";

type Bounds = { start: { line: number }; end: { line: number } };

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
    return "more-indentation";
  }

  return "same-indentation";
}

function linesDifferInIndentation(
  lineA: vscode.TextLine,
  lineB: vscode.TextLine
) {
  return (
    lineA.firstNonWhitespaceCharacterIndex !==
    lineB.firstNonWhitespaceCharacterIndex
  );
}

function lineIsBlockStart(
  prevLine: vscode.TextLine | undefined,
  currentLine: vscode.TextLine
) {
  if (!prevLine) return true;
  if (lineIsStopLine(currentLine)) return false;
  if (lineIsStopLine(prevLine)) return true;
  if (linesDifferInIndentation(prevLine, currentLine)) return true;

  return false;
}

function lineIsBlockEnd(
  currentLine: vscode.TextLine,
  nextLine: vscode.TextLine | undefined
) {
  if (!nextLine) return true;
  if (currentLine.isEmptyOrWhitespace) return false;
  if (lineIsStopLine(nextLine)) return true;
  if (linesDifferInIndentation(currentLine, nextLine)) return true;

  return false;
}

function fromDirection(direction: Direction) {
  return direction === "forwards" ? (x: number) => x + 1 : (x: number) => x - 1;
}

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

function* iterLinesWithNext(
  document: vscode.TextDocument,
  currentLineNumber: number,
  direction: Direction,
  options: {
    bounds?: Bounds;
    currentLineInclusive?: boolean;
  }
) {
  const finalOptions = {
    bounds: { start: { line: 0 }, end: { line: document.lineCount } },
    currentLineInclusive: false,
    ...options,
  };

  const advance = fromDirection(direction);

  if (options.currentLineInclusive === false) {
    currentLineNumber = advance(currentLineNumber);
  }

  const inBounds = (num: number) => {
    return (
      num >= finalOptions.bounds.start.line &&
      num < finalOptions.bounds.end.line
    );
  };

  while (inBounds(currentLineNumber)) {
    const nextLine =
      currentLineNumber === options.bounds!.end.line - 1
        ? undefined
        : document.lineAt(currentLineNumber + 1);

    const currentLine = document.lineAt(currentLineNumber);

    yield { currentLine, nextLine };

    currentLineNumber = advance(currentLineNumber);
  }
}

function toDiff(change: Change) {
  if (change === "greaterThan") return (x: number, y: number) => x > y;
  return (x: number, y: number) => x < y;
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
    moveCursorTo(nextLine.range.start);
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

    if (line) moveCursorTo(line.range.start);
  }
}

export function selectAllBlocksInCurrentScope() {
  const cursorPosition = getCursorPosition();

  let start: Point = cursorPosition;
  let end: Point = cursorPosition;

  for (const blockStart of iterBlockStarts(cursorPosition, {
    direction: "backwards",
    indentationLevel: "same-indentation",
    restrictToCurrentScope: true,
  })) {
    start = blockStart;
  }

  for (const blockEnd of iterBlockEnds(
    cursorPosition,
    "forwards",
    "same-indentation",
    true
  )) {
    end = blockEnd;
  }

  getEditor().selection = new vscode.Selection(
    start.line,
    start.character,
    end.line,
    end.character
  );
}

export function* iterBlockStarts(
  fromPosition: Point,
  options: {
    direction?: Direction;
    indentationLevel?: IndentationRequest;
    restrictToCurrentScope?: boolean;
  }
): Generator<Point> {
  const finalOptions: Required<typeof options> = {
    direction: "forwards",
    indentationLevel: "same-indentation",
    restrictToCurrentScope: false,
    ...options,
  };

  const documentLines = iterLinesWithPrevious(
    getEditor().document,
    fromPosition.line,
    finalOptions.direction
  );

  for (const { prevLine, currentLine } of documentLines) {
    if (lineIsBlockStart(prevLine, currentLine)) {
      const relativeIndentation = getRelativeIndentation(currentLine);

      if (
        finalOptions.restrictToCurrentScope &&
        relativeIndentation === "less-indentation"
      ) {
        return;
      }

      if (
        finalOptions.indentationLevel === "any-indentation" ||
        relativeIndentation === finalOptions.indentationLevel
      ) {
        yield currentLine.range.start.with({
          character: currentLine.firstNonWhitespaceCharacterIndex,
        });
      }
    }
  }
}

export function* iterBlockEnds(
  fromPosition: Point,
  direction: Direction,
  indentationLevel: IndentationRequest,
  restrictToCurrentScope = false
) {
  const document = getEditor().document;

  const documentLines = iterLinesWithNext(
    document,
    fromPosition.line,
    direction,
    { currentLineInclusive: true }
  );

  for (const { currentLine, nextLine } of documentLines) {
    if (lineIsBlockEnd(currentLine, nextLine)) {
      const relativeIndentation = getRelativeIndentation(currentLine);

      if (
        restrictToCurrentScope &&
        relativeIndentation === "less-indentation"
      ) {
        return;
      }

      if (
        indentationLevel === "any-indentation" ||
        relativeIndentation === indentationLevel
      ) {
        yield currentLine.range.end;
      }
    }
  }
}

export function getBlocks(
  pattern: LineEnumerationPattern,
  direction: Direction,
  bounds: vscode.Range
) {
  const cursorPosition = getCursorPosition();

  const primaryDirection = iterBlockStarts(cursorPosition, {
    direction,
    indentationLevel: "any-indentation",
  });

  const secondaryDirection = iterBlockStarts(cursorPosition, {
    direction: opposite(direction),
    indentationLevel: "any-indentation",
  });

  switch (pattern) {
    case "alternate":
      return linqish(primaryDirection).alternateWith(secondaryDirection);
    case "sequential":
      return linqish(primaryDirection).concat(secondaryDirection);
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

  for (const start of iterBlockStarts(continuationPoint, {
    direction,
    indentationLevel: indentation,
    restrictToCurrentScope: true,
  })) {
    selectTo(cursorPosition, start);
    return;
  }

  if (direction !== "forwards") return;

  let candidateEndLine = undefined;

  for (const blockEnd of iterBlockEnds(
    continuationPoint,
    direction,
    "same-indentation",
    true
  )) {
    candidateEndLine = blockEnd;
  }

  if (candidateEndLine) selectTo(cursorPosition, candidateEndLine);
}

export function nextBlankLine(direction: Direction) {
  if (direction === "forwards") {
    moveCursorToNextBlankLine((x) => x + 1);
  } else {
    moveCursorToNextBlankLine((x) => x - 1);
  }
}

export function nextBlockStart(
  direction: Direction,
  indentation: IndentationRequest
) {
  for (const blockStart of iterBlockStarts(getCursorPosition(), {
    direction,
    indentationLevel: indentation,
  })) {
    moveCursorTo(blockStart);

    return;
  }
}

export function nextBlockEnd(
  direction: Direction,
  indentation: IndentationRequest
) {
  for (const blockEnd of iterBlockEnds(
    getCursorPosition(),
    direction,
    indentation
  )) {
    moveCursorTo(blockEnd);

    return;
  }
}

export function moveToNextLineSameLevel(direction: Direction) {
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
        moveCursorTo(line.range.start);
        break;
      }
    }
  }
}

/** A "stop line" is one that is either blank or
 *  contains only punctuation */
export function lineIsStopLine(line: vscode.TextLine) {
  return !/[a-zA-Z0-9]/.test(line.text);
}

export type LineEnumerationPattern = "alternate" | "sequential";
