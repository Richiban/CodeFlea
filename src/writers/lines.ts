import * as vscode from "vscode";
import * as common from "../common";
import * as lines from "../utils/lines";

export function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const sourceLine = document.lineAt(range.start.line);
    const targetIndentation: common.Change =
        direction === "forwards" ? "greaterThan" : "lessThan";

    const targetLine = lines.getNextLineOfChangeOfIndentation(
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

const writer: common.SubjectWriter = {
    delete_: () => {
        throw new Error("Not supported: use VSCode command instead");
    },
    duplicate,
    swapHorizontally,
    swapVertically: () => {
        throw new Error("Not supported: use VSCode command instead");
    },
};

export default writer;
