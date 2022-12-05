import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";

export type LineEnumerationPattern = "alternate" | "sequential";

function search(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    targetChar: common.Char,
    direction: common.Direction
): vscode.Range | undefined {
    const searchLines = lineUtils
        .iterLines(document, startingPosition.line, direction)
        .skip(1);

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
    fromPosition: vscode.Position,
    direction: common.Direction
): common.Linqish<vscode.Range> {
    return common.linqish(
        (function* () {
            let currentLine = document.lineAt(fromPosition);
            let indentation: common.Change =
                direction === "forwards" ? "greaterThan" : "lessThan";

            while (true) {
                const nextLine = lineUtils.getNextLineOfChangeOfIndentation(
                    indentation,
                    direction,
                    document,
                    currentLine
                );

                if (nextLine) {
                    yield nextLine.range;
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
    return document.lineAt(position.line).range;
}

function iterAll(
    document: vscode.TextDocument,
    fromPosition: vscode.Position,
    direction: common.Direction
): common.Linqish<vscode.Range> {
    return lineUtils
        .iterLines(document, fromPosition.line, direction)
        .map((l) => l.range);
}

const subjectReader: common.SubjectReader = {
    getContainingRangeAt,
    iterAll,
    iterHorizontally,
    iterVertically: iterAll,
    search,
};

export default subjectReader;
