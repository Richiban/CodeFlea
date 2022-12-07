import * as vscode from "vscode";
import * as common from "../common";
import blockReader from "../readers/blocks";
import * as editor from "../utils/editor";

function delete_(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    blockRange: vscode.Range
): vscode.Range {
    const prevBlock = blockReader
        .iterVertically(document, {
            startingPosition: blockRange.start,
            direction: "backwards",
            restrictToCurrentScope: true,
        })
        .tryFirst();

    if (prevBlock) {
        edit.delete(new vscode.Range(prevBlock.end, blockRange.end));
        return blockRange;
    }

    const nextBlock = blockReader
        .iterVertically(document, {
            startingPosition: blockRange.end,
            direction: "forwards",
            restrictToCurrentScope: true,
        })
        .tryFirst();

    if (nextBlock) {
        edit.delete(new vscode.Range(blockRange.start, nextBlock.start));
        return blockRange;
    }

    edit.delete(blockRange);

    return blockRange;
}

export function duplicate(
    document: vscode.TextDocument,
    textEdit: vscode.TextEditorEdit,
    blockRange: vscode.Range
): vscode.Range {
    const startLine = document.lineAt(blockRange.start.line);
    const endLine = document.lineAt(blockRange.end.line);

    const linesToDuplicate = document.getText(
        new vscode.Range(
            startLine.range.start,
            endLine.rangeIncludingLineBreak.end
        )
    );

    textEdit.insert(startLine.range.start, linesToDuplicate);

    return blockRange;
}

function swapVertically(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    blockRange: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const thisBlock = blockReader.getContainingRangeAt(
        document,
        blockRange.start
    );

    const nextBlock = blockReader
        .iterVertically(document, {
            startingPosition: blockRange.start,
            direction,
        })
        .tryFirst();

    if (!nextBlock || !thisBlock) {
        return blockRange;
    }

    editor.swap(document, edit, thisBlock, nextBlock);

    return new vscode.Selection(nextBlock.end, nextBlock.start);
}

function swapHorizontally(
    document: vscode.TextDocument,
    edit: vscode.TextEditorEdit,
    range: vscode.Range,
    direction: common.Direction
): vscode.Range {
    const thisBlock = blockReader.getContainingRangeAt(document, range.start);

    if (!thisBlock) {
        return range;
    }

    const targetBlock = blockReader
        .iterHorizontally(document, {
            startingPosition: range.start,
            direction,
        })
        .tryFirst();

    if (!targetBlock) {
        return range;
    }

    const toMove = thisBlock.with({
        end: new vscode.Position(thisBlock.end.line + 1, 0),
    });

    editor.move(document, edit, toMove, targetBlock.start);

    return new vscode.Selection(thisBlock.start, thisBlock.start);
}

const writer: common.SubjectWriter = {
    delete_,
    duplicate,
    swapVertically,
    swapHorizontally,
};

export default writer;
