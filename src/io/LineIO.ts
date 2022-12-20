import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";
import { getNextLineOfChangeOfIndentation } from "../utils/lines";
import Enumerable, { enumerable } from "../utils/Enumerable";
import { wordRangeToPosition as rangeToPosition } from "../utils/selectionsAndRanges";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";

function iterAll(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return lineUtils
        .iterLines(document, options)
        .map((l) => lineUtils.rangeWithoutIndentation(l));
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: IterationOptions
): Enumerable<vscode.Range> {
    return enumerable(function* () {
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

function getClosestRangeAt(
    document: vscode.TextDocument,
    position: vscode.Position
): vscode.Range {
    return document.lineAt(position.line).range;
}

export function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const sourceLine = document.lineAt(range.start.line);
    const targetIndentation: common.Change =
        direction === "forwards" ? "greaterThan" : "lessThan";

    const targetLine = getNextLineOfChangeOfIndentation(
        targetIndentation,
        direction,
        document,
        sourceLine
    );

    if (targetLine) {
        const sourceLineRange = sourceLine.rangeIncludingLineBreak;
        const newLineText =
            targetLine.text.substring(
                0,
                targetLine.firstNonWhitespaceCharacterIndex
            ) +
            document
                .getText(sourceLineRange)
                .substring(sourceLine.firstNonWhitespaceCharacterIndex);

        edit.insert(targetLine.range.start, newLineText);
        edit.delete(sourceLineRange);

        return new vscode.Range(
            new vscode.Position(
                targetLine.lineNumber,
                sourceLine.range.start.character
            ),
            new vscode.Position(
                targetLine.lineNumber,
                sourceLine.range.end.character
            )
        );
    }

    return range;
}

export function duplicate(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    selection: vscode.Selection
): vscode.Range {
    const startLine = document.lineAt(selection.start.line);
    const endLine = document.lineAt(selection.end.line);

    const linesToDuplicate = document.getText(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    textEdit.insert(startLine.range.start, linesToDuplicate);

    return selection;
}

export default class LineIO extends SubjectIOBase {
    deletableSeparators = /\s/;

    getContainingObjectAt = getClosestRangeAt;
    getClosestRangeTo = getClosestRangeAt;
    iterAll = iterAll;
    iterHorizontally = iterHorizontally;
    iterVertically = iterAll;

    deleteObject() {
        throw new Error("Not supported: use VSCode command instead");
    }

    swapHorizontally = swapHorizontally;

    swapVertically(): vscode.Range {
        throw new Error("Not supported: use VSCode command instead");
    }
}
