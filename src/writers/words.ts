import * as vscode from "vscode";
import wordReader from "../readers/words";
import * as common from "../common";
import * as editor from "../utils/editor";

const separationCharacters = " ,.:=+-*/%\r\n".split("");

function getSeparatingTextRange(
    document: vscode.TextDocument,
    wordRange: vscode.Range
): vscode.Range | undefined {
    const wordBefore = wordReader
        .iterAll(document, {
            startingPosition: wordRange,
            direction: "backwards",
        })
        .tryFirst();

    const wordAfter = wordReader
        .iterAll(document, {
            startingPosition: wordRange,
            direction: "forwards",
        })
        .tryFirst();

    const separatingTextRangeBefore =
        wordBefore && new vscode.Range(wordBefore.end, wordRange.start);

    const separatingTextRangeAfter =
        wordAfter && new vscode.Range(wordRange.end, wordAfter.start);

    const separatingTextBefore =
        separatingTextRangeBefore &&
        document.getText(separatingTextRangeBefore);

    const separatingTextAfter =
        separatingTextRangeAfter && document.getText(separatingTextRangeAfter);

    if (
        separatingTextAfter &&
        (separatingTextBefore === undefined ||
            separatingTextAfter.length < separatingTextBefore.length) &&
        separatingTextAfter
            .split("")
            .every((c) => separationCharacters.includes(c))
    ) {
        return separatingTextRangeAfter;
    }

    if (
        separatingTextBefore &&
        separatingTextBefore
            .split("")
            .every((c) => separationCharacters.includes(c))
    ) {
        return separatingTextRangeBefore;
    }
}

export function deleteWord(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    selection: vscode.Selection
): vscode.Range {
    edit.delete(selection);

    const separatingTextRange = getSeparatingTextRange(document, selection);

    if (separatingTextRange) {
        edit.delete(separatingTextRange);
    }

    return selection;
}

export function duplicateWord(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    selection: vscode.Selection
): vscode.Range {
    const separationTextRange = getSeparatingTextRange(document, selection);

    if (separationTextRange) {
        const separationText = document.getText(separationTextRange);

        if (separationTextRange.start <= selection.end) {
            textEdit.insert(selection.end, separationText);
        } else {
            textEdit.insert(selection.start, separationText);
        }
    }

    textEdit.insert(selection.end, document.getText(selection));

    return selection;
}

export function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const targetWordRange = wordReader
        .iterHorizontally(document, {
            startingPosition: range,
            direction,
        })
        .tryFirst();

    if (targetWordRange) {
        editor.swap(document, edit, range, targetWordRange);

        return targetWordRange;
    }

    return range;
}

export function swapVertically(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const targetWordRange = wordReader
        .iterVertically(document, {
            startingPosition: range,
            direction,
        })
        .tryFirst();

    if (targetWordRange) {
        editor.swap(document, edit, range, targetWordRange);

        return targetWordRange;
    }

    return range;
}

const writer: common.SubjectWriter = {
    remove: deleteWord,
    duplicate: duplicateWord,
    swapHorizontally,
    swapVertically,
};

export default writer;
