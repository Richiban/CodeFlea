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
function getEditor() {
    return vscode.window.activeTextEditor;
}
function getDocument() {
    var _a;
    return (_a = getEditor()) === null || _a === void 0 ? void 0 : _a.document;
}
function moveCursorToBeginningOfLine(line) {
    const editor = getEditor();
    if (!editor)
        return;
    editor.selection = new vscode.Selection(new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex), new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex));
}
function moveCursorToEndOfLine(line) {
    const editor = getEditor();
    if (!editor)
        return;
    editor.selection = new vscode.Selection(new vscode.Position(line.lineNumber, line.range.end.character), new vscode.Position(line.lineNumber, line.range.end.character));
}
function getCursorPosition() {
    const editor = getEditor();
    if (!editor)
        return;
    if (editor.selection.isEmpty) {
        return editor.selection.active;
    }
}
exports.default = {
    moveCursorToBeginningOfLine,
    moveCursorToEndOfLine,
    moveCursorTo,
    getCursorPosition,
    getDocument
};
//# sourceMappingURL=editor.js.map