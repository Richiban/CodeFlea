"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
function moveCursorTo(lineNumber, column) {
    const editor = getEditor();
    if (!editor)
        return;
    editor.selection = new vscode.Selection(new vscode.Position(lineNumber, column), new vscode.Position(lineNumber, column));
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
    moveCursorTo,
    getCursorPosition,
    getDocument
};
//# sourceMappingURL=editor.js.map