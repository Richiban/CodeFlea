import * as vscode from "vscode";

export function translateWithWrap(
    document: vscode.TextDocument,
    position: vscode.Position,
    characterDelta: number
): vscode.Position {
    const finalOffset = document.offsetAt(
        new vscode.Position(document.lineCount, 0)
    );

    let newOffset = document.offsetAt(position) + characterDelta;

    if (newOffset > finalOffset) {
        newOffset = finalOffset;
    }

    return document.positionAt(newOffset);
}
