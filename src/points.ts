import { Direction } from "./common";
import editor from "./editor";

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

    if (idx <= 0) return 0;

    if (idx >= s.length) return s.length;

    if (isPunctuation(s[idx - 1]) && !isPunctuation(s[idx])) {
      return nextNonWhiteSpaceChar(s, idx);
    }
  } while (true);

  return idx;
}

function moveToInterestingPoint(direction: Direction) {
  const cursorPosition = editor.getCursorPosition();
  const document = editor.getDocument();

  if (!cursorPosition || !document) return;

  const currentLine = document.lineAt(cursorPosition.line);

  const index = getIndexOfNextPunctuationChar(currentLine.text, {
    backwards: direction === "backwards",
    startingIndex: cursorPosition.character
  });

  if (index) editor.moveCursorTo(cursorPosition.line, index);
}

export default { moveToInterestingPoint };
