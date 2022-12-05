import * as vscode from "vscode";
import wordReader from "../readers/words";
import * as common from "../common";
import * as editor from "../utils/editor";

const separationCharacters = " ,.:=+-*/%\r\n".split("");

function getSeparatingText(
    document: vscode.TextDocument,
    wordRange: vscode.Range
): vscode.Range | undefined {
    const wordBefore = wordReader
        .iterAll(document, wordRange.start, "backwards")
        .tryFirst();

    const wordAfter = wordReader
        .iterAll(document, wordRange.end, "forwards")
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
    e: vscode.TextEditorEdit,
    selection: vscode.Selection
): vscode.Range {
    e.delete(selection);

    const separationText = getSeparatingText(document, selection);

    if (separationText) {
        e.delete(separationText);
    }

    return selection;
}

export function duplicateWord(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    selection: vscode.Selection
): vscode.Range {
    const separationTextRange = getSeparatingText(document, selection);

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
    const getEnd: keyof vscode.Range =
        direction === "forwards" ? "end" : "start";

    const targetWordRange = wordReader
        .iterHorizontally(document, range[getEnd], direction)
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
    const getEnd: keyof vscode.Range =
        direction === "forwards" ? "end" : "start";

    const targetWordRange = wordReader
        .iterVertically(document, range[getEnd], direction)
        .tryFirst();

    if (targetWordRange) {
        editor.swap(document, edit, range, targetWordRange);

        return targetWordRange;
    }

    return range;
}

const writer: common.SubjectWriter = {
    delete_: deleteWord,
    duplicate: duplicateWord,
    swapHorizontally,
    swapVertically,
};

export default writer;
