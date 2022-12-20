import { Direction } from "../common";
import Enumerable, { enumerable } from "./Enumerable";
import * as vscode from "vscode";
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
    editor: vscode.TextEditor,
    startPosition: vscode.Position,
    direction: Direction = "forwards"
) {
    for (const point of getInterestingPoints(
        editor,
        startPosition,
        direction
    )) {
        editor.selection = new vscode.Selection(point, point);
        return;
    }
}

export function getInterestingPoints(
    editor: vscode.TextEditor,
    startPosition: vscode.Position,
    direction: Direction = "forwards"
): Enumerable<vscode.Position> {
    return enumerable(function* () {
        const document = editor.document;

        if (!startPosition || !document) {
            return;
        }

        for (const l of iterLines(document, {
            startingPosition: startPosition,
            direction,
            currentInclusive: true,
        })) {
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
    });
}
