"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function moveCursorTo(lineNumber, column) {
    const editor = getEditor();
    if (!editor)
        return;
    const position = new vscode.Position(lineNumber, column);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
}
exports.moveCursorTo = moveCursorTo;
function getEditor() {
    return vscode.window.activeTextEditor;
}
exports.getEditor = getEditor;
function moveCursorToBeginningOfLine(line) {
    const editor = getEditor();
    if (!editor)
        return;
    editor.selection = new vscode.Selection(new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex), new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex));
}
exports.moveCursorToBeginningOfLine = moveCursorToBeginningOfLine;
function moveCursorToEndOfLine(line) {
    const editor = getEditor();
    if (!editor)
        return;
    editor.selection = new vscode.Selection(new vscode.Position(line.lineNumber, line.range.end.character), new vscode.Position(line.lineNumber, line.range.end.character));
}
exports.moveCursorToEndOfLine = moveCursorToEndOfLine;
function getCursorPosition() {
    const editor = getEditor();
    if (!editor)
        return;
    if (editor.selection.isEmpty) {
        return editor.selection.active;
    }
}
exports.getCursorPosition = getCursorPosition;
//# sourceMappingURL=editor.js.map