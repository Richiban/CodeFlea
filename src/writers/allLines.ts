import * as vscode from "vscode";
import * as common from "../common";
import * as editor from "../utils/editor";
import * as lineUtils from "../utils/lines";

function swapLineSideways(
    document: vscode.TextDocument,
    position: vscode.Position,
    edit: vscode.TextEditorEdit,
    direction: "left" | "right"
): vscode.Range | undefined {
    const sourceLine = document.lineAt(position.line);
    const targetIndentation: common.Change =
        direction === "right" ? "greaterThan" : "lessThan";
    const lineDirection: common.Direction =
        direction === "right" ? "forwards" : "backwards";

    const targetLine = lineUtils.getNextLineOfChangeOfIndentation(
        targetIndentation,
        lineDirection,
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
}

function duplicate(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    range: vscode.Range
): vscode.Range {
    const startLine = document.lineAt(range.start.line);
    const endLine = document.lineAt(range.end.line);

    const linesToDuplicate = document.getText(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    textEdit.insert(startLine.range.start, linesToDuplicate);

    return range;
}

function delete_(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    range: vscode.Range
): vscode.Range {
    const startLine = document.lineAt(range.start.line);
    const endLine = document.lineAt(range.end.line);

    textEdit.delete(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    return range;
}

function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const change = direction === "forwards" ? "greaterThan" : "lessThan";
    const sourceLine = document.lineAt(range.start.line);
    const targetLine = lineUtils.getNextLineOfChangeOfIndentation(
        change,
        direction,
        document,
        sourceLine
    );

    if (targetLine) {
        editor.swap(document, edit, sourceLine.range, targetLine.range);
    }

    return targetLine?.range ?? sourceLine.range;
}

function swapVertically(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const sourceLine = document.lineAt(range.start.line);
    const targetLine = lineUtils
        .iterLines(document, sourceLine.lineNumber, direction)
        .tryFirst();

    if (targetLine) {
        editor.swap(document, edit, sourceLine.range, targetLine.range);
    }

    return targetLine?.range ?? sourceLine.range;
}

const writer: common.SubjectWriter = {
    delete_: delete_,
    duplicate: duplicate,
    swapHorizontally: swapHorizontally,
    swapVertically: swapVertically,
};

export default writer;
