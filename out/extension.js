"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
function lineIsBoring(line) {
    return !/[a-zA-Z0-9]/.test(line.text);
}
function lineIsIndentationChange(prevLine, currentLine) {
    return (prevLine.firstNonWhitespaceCharacterIndex !==
        currentLine.firstNonWhitespaceCharacterIndex);
}
function lineIsInteresting(prevLine, currentLine) {
    if (lineIsBoring(currentLine))
        return false;
    if (!prevLine)
        return true;
    return (lineIsIndentationChange(prevLine, currentLine) || lineIsBoring(prevLine));
}
function moveCursorToBeginningOfLine(editor, line) {
    editor.selection = new vscode.Selection(new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex), new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex));
}
function fromDirection(direction) {
    return direction === "forwards" ? (x) => x + 1 : (x) => x - 1;
}
function* iterLines(document, currentLineNumber, direction) {
    const advance = fromDirection(direction);
    currentLineNumber = advance(currentLineNumber);
    while (withinBounds()) {
        const prevLine = currentLineNumber === 0
            ? undefined
            : document.lineAt(currentLineNumber - 1);
        const currentLine = document.lineAt(currentLineNumber);
        yield { prevLine, currentLine };
        currentLineNumber = advance(currentLineNumber);
    }
    function withinBounds() {
        return currentLineNumber >= 0 && currentLineNumber < document.lineCount;
    }
}
function moveTo(direction) {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.selection.isEmpty) {
        const position = editor.selection.active;
        const documentLines = iterLines(editor.document, position.line, direction);
        for (const { prevLine, currentLine } of documentLines) {
            if (lineIsInteresting(prevLine, currentLine)) {
                moveCursorToBeginningOfLine(editor, currentLine);
                break;
            }
        }
    }
}
function moveToNextInterestingLine() {
    return moveTo("forwards");
}
function moveToPrevInterestingLine() {
    return moveTo("backwards");
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codeflea" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand("extension.nextInterestingLine", moveToNextInterestingLine));
    context.subscriptions.push(vscode.commands.registerCommand("extension.prevInterestingLine", moveToPrevInterestingLine));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map