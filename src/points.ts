import { Direction, linqish, Linqish } from "./common";
import {
  getEditor,
  getCursorPosition,
  moveCursorTo,
  moveCursorToEndOfLine,
  moveCursorToBeginningOfLine
} from "./editor";
import { iterLines, lineIsBoring } from "./lines";

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

function* getIndexesOfPunctuation(
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
      yield nextNonWhiteSpaceChar(s, idx);
    }
  } while (true);
}

export function moveToNextInterestingPoint(direction: Direction = "forwards") {
  for (const point of getInterestingPoints(direction)) {
    moveCursorTo(point.lineNumber, point.charIndex);
    return;
  }
}

export type Point = { lineNumber: number; charIndex: number };

export function getInterestingPoints(
  direction: Direction = "forwards"
): Linqish<Point> {
  return linqish(
    (function*() {
      const cursorPosition = getCursorPosition();
      const document = getEditor()?.document;

      if (!cursorPosition || !document) return;

      for (const l of iterLines(
        document,
        cursorPosition.line,
        direction,
        false
      )) {
        if (lineIsBoring(l)) return;

        yield {
          lineNumber: l.lineNumber,
          charIndex: l.firstNonWhitespaceCharacterIndex
        };

        for (const c of getIndexesOfPunctuation(l.text, {
          backwards: false,
          startingIndex: 0
        })) {
          yield { lineNumber: l.lineNumber, charIndex: c };
        }

        yield { lineNumber: l.lineNumber, charIndex: l.range.end.character };
      }
    })()
  );
}

export function getInterestingPoints2(direction: Direction = "forwards") {
  return linqish(
    (function*() {
      const cursorPosition = getCursorPosition();
      const document = getEditor()?.document;

      if (!cursorPosition || !document) return;

      let currentLine = document.lineAt(cursorPosition.line);

      while (true) {
        const index = getIndexesOfPunctuation(currentLine.text, {
          backwards: direction === "backwards",
          startingIndex: cursorPosition.character
        });

        if (index)
          yield { lineNumber: currentLine.lineNumber, charIndex: index };
        else {
          if (direction === "backwards" && cursorPosition.line > 0) {
            const l = document.lineAt(currentLine.lineNumber - 1);
            yield {
              lineNumber: l.lineNumber,
              charIndex: l.range.end.character
            };
          } else if (
            direction === "forwards" &&
            cursorPosition.line < document.lineCount - 1
          ) {
            const l = document.lineAt(currentLine.lineNumber + 1);

            yield {
              lineNumber: l.lineNumber,
              charIndex: l.firstNonWhitespaceCharacterIndex
            };
          }
        }
      }
    })()
  );
}
