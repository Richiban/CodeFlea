import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";
import { wordRangeToPosition } from "../utils/selectionsAndRanges";

export type LineEnumerationPattern = "alternate" | "sequential";

function search(
    document: vscode.TextDocument,
    targetChar: common.Char,
    options: common.IterationOptions
): vscode.Range | undefined {
    const searchLines = lineUtils.iterLines(document, options);

    for (const line of searchLines) {
        const char = document.getText(line.range)[
            line.firstNonWhitespaceCharacterIndex
        ];

        if (char === targetChar) {
            return line.range;
        }
    }
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: common.IterationOptions
): common.Linqish<vscode.Range> {
    return common.linqish(
        (function* () {
            let currentLine = document.lineAt(
                wordRangeToPosition(options.startingPosition, options.direction)
            );
            let indentation: common.Change =
                options.direction === "forwards" ? "greaterThan" : "lessThan";

            while (true) {
                const nextLine = lineUtils.getNextLineOfChangeOfIndentation(
                    indentation,
                    options.direction,
                    document,
                    currentLine
                );

                if (nextLine) {
                    yield lineUtils.rangeWithoutIndentation(nextLine);
                } else {
                    break;
                }
            }
        })()
    );
}

function getContainingRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    return lineUtils.rangeWithoutIndentation(document.lineAt(position.line));
}

function getClosestRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    return lineUtils.getNearestSignificantLine(document, position).range;
}

function iterVertically(
    document: vscode.TextDocument,
    options: common.IterationOptions
): common.Linqish<vscode.Range> {
    return lineUtils
        .iterLines(document, options)
        .filter(lineUtils.lineIsSignificant)
        .map(lineUtils.rangeWithoutIndentation);
}

const subjectReader: common.SubjectReader = {
    getContainingRangeAt,
    getClosestRangeTo: getClosestRangeAt,
    iterAll: iterVertically,
    iterHorizontally,
    iterVertically,
    search,
};

export default subjectReader;
