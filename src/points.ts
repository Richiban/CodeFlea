import { Direction, linqish, Linqish } from "./common";
import { getEditor, getCursorPosition, moveCursorTo } from "./editor";
import { iterLines, lineIsMeaningless } from "./lines";

const interestingChars = new Set(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
);

function isInteresting(char: string) {
  return interestingChars.has(char);
}

function isPunctuation(char: string) {
  return !/[a-zA-Z0-9\s]/.test(char);
}

function* getInterestingPointsInText(
  s: string,
  options = {
    startingIndex: 0,
    backwards: false,
  }
) {
  const advance = options.backwards
    ? (x: number) => x - 1
    : (x: number) => x + 1;

  let idx = options.startingIndex;
  let shouldYield = true;

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
  for (const point of getInterestingPoints(direction).skip(2)) {
    moveCursorTo(point.lineNumber, point.charIndex);
    return;
  }
}

export type Point = { lineNumber: number; charIndex: number };

export function getInterestingPoints(
  direction: Direction = "forwards"
): Linqish<Point> {
  return linqish(
    (function* () {
      const cursorPosition = getCursorPosition();
      const document = getEditor()?.document;

      if (!cursorPosition || !document) return;

      for (const l of iterLines(
        document,
        cursorPosition.line,
        direction,
        false
      )) {
        if (lineIsMeaningless(l)) return;

        for (const c of getInterestingPointsInText(l.text, {
          backwards: false,
          startingIndex: 0,
        })) {
          if (
            l.lineNumber !== cursorPosition.line ||
            c !== cursorPosition.character + 1
          )
            yield { lineNumber: l.lineNumber, charIndex: c };
        }
      }
    })()
  );
}
