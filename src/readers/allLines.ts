import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";

function getContainingRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    const line = document.lineAt(position.line);

    return line.range;
}

function iterAll(
    document: vscode.TextDocument,
    fromPosition: vscode.Position,
    direction: common.Direction
): common.Linqish<vscode.Range> {
    return lineUtils
        .iterLines(document, fromPosition.line, direction, {
            currentInclusive: false,
        })
        .map((l) => l.range);
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

function search(
    document: vscode.TextDocument,
    startingPosition: vscode.Position,
    searchString: common.Char,
    direction: common.Direction
): vscode.Range | undefined {
    const allLines = lineUtils.iterLines(
        document,
        startingPosition.line,
        direction,
        { currentInclusive: false }
    );

    return allLines
        .filterMap((line) => {
            if (
                line.text
                    .substring(line.firstNonWhitespaceCharacterIndex)
                    .startsWith(searchString)
            ) {
                return line.range;
            }
        })
        .tryFirst();
}

function getClosestRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    return document.lineAt(position.line).range;
}

const subjectReader: common.SubjectReader = {
    getContainingRangeAt,
    getClosestRangeTo: getClosestRangeAt,
    iterAll,
    iterHorizontally,
    iterVertically: iterAll,
    search,
};

export default subjectReader;
