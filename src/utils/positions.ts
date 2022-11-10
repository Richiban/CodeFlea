import * as vscode from "vscode";

export function translateWithWrap(
    document: vscode.TextDocument,
    position: vscode.Position,
    characterDelta: number
): vscode.Position | undefined {
    const finalOffset = document.offsetAt(
        new vscode.Position(document.lineCount, 0)
    );
    const newOffset = document.offsetAt(position) + characterDelta;

    if (newOffset > finalOffset) {
        return;
    }

    return document.positionAt(newOffset);
}
