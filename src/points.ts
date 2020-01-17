import { Direction, linqish, Linqish } from "./common";
import { getEditor, getCursorPosition, moveCursorTo } from "./editor";
import { iterLines, lineIsBoring } from "./lines";

function isInteresting(char: string) {
  return /[a-zA-Z0-9]/.test(char);
}

function isPunctuation(char: string) {
  return !/[a-zA-Z0-9\s]/.test(char);
}

function* getInterestingPointsInText(
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

  let shouldYield = false;

  do {
    idx = advance(idx);

    if (idx < 0 || idx > s.length) return;
    if (idx === 0 || idx === s.length) yield idx;

    if (shouldYield && isInteresting(s[idx])) {
      yield idx;
      shouldYield = false;
    } else if (isPunctuation(s[idx])) {
      shouldYield = true;
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

        for (const c of getInterestingPointsInText(l.text, {
          backwards: false,
          startingIndex: 0
        })) {
          yield { lineNumber: l.lineNumber, charIndex: c };
        }
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
        const index = getInterestingPointsInText(currentLine.text, {
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
