import * as vscode from "vscode";
import * as common from "../common";
import * as lineUtils from "../utils/lines";
import { getNextLineOfChangeOfIndentation } from "../utils/lines";
import Seq, { seq } from "../utils/seq";
import { rangeToPosition } from "../utils/selectionsAndRanges";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";
import { Direction, TextObject } from "../common";

function iterAll(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    return lineUtils
        .iterLines(document, options)
        .map((l) => lineUtils.rangeWithoutIndentation(l));
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    return seq(function* () {
        let currentLine: vscode.TextLine | undefined = document.lineAt(
            rangeToPosition(options.startingPosition, options.direction)
        );
        const indentation: common.Change =
            options.direction === Direction.forwards ? "greaterThan" : "lessThan";
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
        direction === Direction.forwards ? "greaterThan" : "lessThan";

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

function iterScope(
    document: vscode.TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    const startingPosition = rangeToPosition(
        options.startingPosition,
        options.direction
    );

    const startingLine = document.lineAt(startingPosition);

    return lineUtils
        .iterLines(document, options)
        .takeWhile((l) => {
            switch (lineUtils.getRelativeIndentation(startingLine, l)) {
                case "same-indentation":
                case "no-indentation":
                    return true;
                default:
                    return false;
            }
        })
        .map((l) => lineUtils.rangeWithoutIndentation(l));
}

export default class LineIO extends SubjectIOBase {
    deletableSeparators = /\s/;
    defaultSeparationText = "\n";

    getContainingObjectAt = getClosestRangeAt;
    getClosestRangeTo = getClosestRangeAt;
    iterAll = iterAll;
    iterHorizontally = iterHorizontally;
    iterVertically = iterAll;
    iterScope = iterScope;

    deleteObject() {
        throw new Error("Not supported: use VSCode command instead");
    }

    swapHorizontally = swapHorizontally;

    swapVertically(): vscode.Range {
        throw new Error("Not supported: use VSCode command instead");
    }
}
