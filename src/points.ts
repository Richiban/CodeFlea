import { Direction } from "./common";
import {
  getEditor,
  getCursorPosition,
  moveCursorTo,
  moveCursorToEndOfLine,
  moveCursorToBeginningOfLine
} from "./editor";

const nonPunctuationRegex = /[a-zA-Z0-9]/;

function isPunctuation(char: string) {
  return !nonPunctuationRegex.test(char);
}

function nextNonWhiteSpaceChar(s: string, startingIndex: number) {
  let i = startingIndex;

  while (/\s/.test(s[i])) {
    i++;
  }

  return i;
}

function getIndexOfNextPunctuationChar(
  s: string,
  options = {
    startingIndex: 0,
    backwards: false
  }
) {
  let idx = options.startingIndex;

  const advance = options.backwards
    ? (x: number) => x - 1
    : (x: number) => x + 1;

  do {
    idx = advance(idx);

    if (idx === 0) return 0;
    if (idx < 0) return undefined;
    if (idx === s.length) return s.length;
    if (idx > s.length) return undefined;

    if (isPunctuation(s[idx - 1]) && !isPunctuation(s[idx])) {
      return nextNonWhiteSpaceChar(s, idx);
    }
  } while (true);
}

function moveToInterestingPoint(direction: Direction) {
  const cursorPosition = getCursorPosition();
  const document = getEditor()?.document;

  if (!cursorPosition || !document) return;

  const currentLine = document.lineAt(cursorPosition.line);

  const index = getIndexOfNextPunctuationChar(currentLine.text, {
    backwards: direction === "backwards",
    startingIndex: cursorPosition.character
  });

  if (index) moveCursorTo(cursorPosition.line, index);
  else {
    if (direction === "backwards" && cursorPosition.line > 0) {
      moveCursorToEndOfLine(document.lineAt(cursorPosition.line - 1));
    } else if (
      direction === "forwards" &&
      cursorPosition.line < document.lineCount - 1
    ) {
      moveCursorToBeginningOfLine(document.lineAt(cursorPosition.line + 1));
    }
  }
}

export default { moveToInterestingPoint };
