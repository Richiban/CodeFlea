import { Direction, linqish, Linqish } from "../common";
import { getEditor, moveCursorTo } from "./editor";
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

        if (idx < 0 || idx > line.text.length) {
            return;
        }

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

export async function nextInterestingPoint(
    startPosition: vscode.Position,
    direction: Direction = "forwards"
) {
    for (const point of getInterestingPoints(startPosition, direction)) {
        await moveCursorTo(point);
        return;
    }
}

export function getInterestingPoints(
    startPosition: vscode.Position,
    direction: Direction = "forwards"
): Linqish<vscode.Position> {
    return linqish(
        (function* () {
            const document = getEditor()?.document;

            if (!startPosition || !document) {
                return;
            }

            for (const l of iterLines(
                document,
                startPosition.line,
                direction
            )) {
                if (lineIsStopLine(l)) {
                    return;
                }

                for (const c of getInterestingPointsInLine(l, {
                    direction: direction,
                    startingIndex: startPosition.character,
                })) {
                    if (
                        l.lineNumber !== startPosition.line ||
                        c !== startPosition.character + 1
                    ) {
                        yield new vscode.Position(l.lineNumber, c);
                    }
                }
            }
        })()
    );
}