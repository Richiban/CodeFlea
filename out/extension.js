"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "codeflea" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand("extension.nextInterestingLine", () => {
        // The code you place here will be executed every time your command is executed
        var _a;
        // Display a message box to the user
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.selection.isEmpty) {
            // the Position object gives you the line and character where the cursor is
            const position = editor.selection.active;
            vscode.window.showInformationMessage("You're on line " + position.line);
            function lineIsBoring(line) {
                return !/[a-zA-Z0-9]/.test(line.text);
            }
            function lineIsIndentationChange(prevLine, currentLine) {
                return (prevLine.firstNonWhitespaceCharacterIndex !==
                    currentLine.firstNonWhitespaceCharacterIndex);
            }
            function lineIsInteresting(currentLine) {
                var _a;
                if (lineIsBoring(currentLine)) {
                    return false;
                }
                const prevLine = (_a = editor) === null || _a === void 0 ? void 0 : _a.document.lineAt(currentLine.lineNumber - 1);
                if (!prevLine)
                    return false;
                return (lineIsIndentationChange(prevLine, currentLine) ||
                    lineIsBoring(prevLine));
            }
            var currentLineNumber = position.line;
            var currentLine = null;
            while (currentLineNumber < editor.document.lineCount - 1) {
                currentLineNumber++;
                currentLine = editor.document.lineAt(currentLineNumber);
                if (lineIsInteresting(currentLine)) {
                    break;
                }
            }
            const column = ((_a = currentLine) === null || _a === void 0 ? void 0 : _a.firstNonWhitespaceCharacterIndex) || 0;
            editor.selection = new vscode.Selection(new vscode.Position(currentLineNumber, column), new vscode.Position(currentLineNumber, column));
        }
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map