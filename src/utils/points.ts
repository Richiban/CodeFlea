import { Direction, linqish, Linqish, Point } from "../common";
import { getEditor, getCursorPosition, moveCursorTo } from "./editor";
import { iterLines, lineIsStopLine } from "./lines";
import * as vscode from "vscode";

const interestingChars = new Set(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
);

function isInteresting(char: string) {
    return interestingChars.has(char);
}

function widen<T>(val: T) {
    return val;
}

function* getInterestingPointsInLine(
    line: vscode.TextLine,
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

    let hadOperator = false;

    do {
        idx = advance(idx);

        if (idx < 0 || idx > line.text.length) return;
        if (idx === 0 || idx === line.text.length) {
            yield idx;
            return;
        }

        if (isInteresting(line.text[idx])) {
            if (hadOperator) {
                yield idx;
            }

            hadOperator = false;
        } else {
            if (isOperator(line.text[idx])) {
                hadOperator = true;
            }
        }
    } while (true);
}

const isOperator = '()[]{}=:/\\|^&+;<>!"'.includes;

export async function nextInterestingPoint(direction: Direction = "forwards") {
    for (const point of getInterestingPoints(direction)) {
        await moveCursorTo(point);
        return;
    }
}

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
                direction
            )) {
                if (lineIsStopLine(l)) return;

                for (const c of getInterestingPointsInLine(l, {
                    direction: direction,
                    startingIndex: cursorPosition.character,
                })) {
                    if (
                        l.lineNumber !== cursorPosition.line ||
                        c !== cursorPosition.character + 1
                    )
                        yield { line: l.lineNumber, character: c };
                }
            }
        })()
    );
}

export function areEqual(a: Point, b: Point) {
    return a.line === b.line && a.character === b.character;
}
