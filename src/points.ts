import { Direction, linqish, Linqish } from "./common";
import { getEditor, getCursorPosition, moveCursorTo } from "./editor";
import { iterLines, lineIsStopLine } from "./lines";

const interestingChars = new Set(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
);

function isInteresting(char: string) {
  return interestingChars.has(char);
}

function widen<T>(val: T) {
  return val;
}

function* getInterestingPointsInText(
  s: string,
  options = {
    startingIndex: 0,
    direction: widen<Direction>("backwards"),
  }
) {
  const advance =
    options.direction === "backwards"
      ? (x: number) => x - 1
      : (x: number) => x + 1;

  let idx = options.startingIndex;

  do {
    idx = advance(idx);

    if (idx < 0 || idx > s.length) return;
    if (idx === 0 || idx === s.length) {
      yield idx;
      return;
    }

    if (!isInteresting(s[idx - 1]) && isInteresting(s[idx])) {
      yield idx;
    }
  } while (true);
}

export async function nextInterestingPoint(direction: Direction = "forwards") {
  for (const point of getInterestingPoints(direction)) {
    await moveCursorTo(point.lineNumber, point.charIndex);
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
        if (lineIsStopLine(l)) return;

        for (const c of getInterestingPointsInText(l.text, {
          direction: direction,
          startingIndex: cursorPosition.character,
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
