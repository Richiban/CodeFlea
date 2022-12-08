import * as vscode from "vscode";
import interwordReader from "../readers/interwords";
import * as common from "../common";
import * as editor from "../utils/editor";

const separationCharacters = " ,.:=+-*/%\r\n".split("");

function getSeparatingText(
    document: vscode.TextDocument,
    wordRange: vscode.Range
): vscode.Range | undefined {
    const wordBefore = interwordReader
        .iterAll(document, {
            startingPosition: wordRange.start,
            direction: "backwards",
        })
        .tryFirst();

    const wordAfter = interwordReader
        .iterAll(document, {
            startingPosition: wordRange.end,
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

export function remove(
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

export function duplicate(
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

    const targetWordRange = interwordReader
        .iterHorizontally(document, {
            startingPosition: range[getEnd],
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
    const getEnd: keyof vscode.Range =
        direction === "forwards" ? "end" : "start";

    const targetWordRange = interwordReader
        .iterVertically(document, {
            startingPosition: range[getEnd],
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
    remove,
    duplicate,
    swapHorizontally,
    swapVertically,
};

export default writer;
