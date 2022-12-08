import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";
import Linqish, { linqish } from "../utils/Linqish";
import { wordRangeToPosition as rangeToPosition } from "../utils/selectionsAndRanges";

function getContainingRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range | undefined {
    const line = document.lineAt(position.line);

    return line.range;
}

function iterAll(
    document: vscode.TextDocument,
    options: common.IterationOptions
): Linqish<vscode.Range> {
    return lineUtils.iterLines(document, options).map((l) => l.range);
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: common.IterationOptions
): Linqish<vscode.Range> {
    return linqish(function* () {
        let currentLine: vscode.TextLine | undefined = document.lineAt(
            rangeToPosition(options.startingPosition, options.direction)
        );
        const indentation: common.Change =
            options.direction === "forwards" ? "greaterThan" : "lessThan";
        let first = true;

        do {
            if (currentLine && (!first || options.currentInclusive)) {
                yield lineUtils.rangeWithoutIndentation(currentLine);
            }

            currentLine = lineUtils.getNextLineOfChangeOfIndentation(
                indentation,
                options.direction,
                document,
                currentLine
            );

            first = false;
        } while (currentLine);
    });
}

function search(
    document: vscode.TextDocument,
    searchString: common.Char,
    options: common.IterationOptions
): vscode.Range | undefined {
    const allLines = lineUtils.iterLines(document, options);

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
