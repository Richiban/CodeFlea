import * as vscode from "vscode";
import * as positions from "./positions";

export function nextWord(
    document: vscode.TextDocument,
    currentPosition: vscode.Position
): vscode.Range | undefined {
    let wordRange = undefined;
    let newPosition: vscode.Position | undefined = currentPosition;

    do {
        newPosition = positions.translateWithWrap(document, newPosition, 2);

        if (newPosition) {
            wordRange = document.getWordRangeAtPosition(newPosition);
        }
    } while (!wordRange && newPosition);

    if (wordRange) {
        return new vscode.Range(wordRange.start, wordRange.end);
    }

    return undefined;
}

export function prevWord(
    document: vscode.TextDocument,
    currentPosition: vscode.Position
): vscode.Range | undefined {
    let wordRange = undefined;
    let newPosition: vscode.Position | undefined = currentPosition;

    do {
        newPosition = positions.translateWithWrap(document, newPosition, -2);

        if (newPosition) {
            wordRange = document.getWordRangeAtPosition(newPosition);
        }
    } while (!wordRange && newPosition);

    if (wordRange) {
        return new vscode.Range(wordRange.start, wordRange.end);
    }

    return undefined;
}
