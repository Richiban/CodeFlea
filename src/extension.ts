// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "codeflea" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "extension.nextInterestingLine",
    () => {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      const editor = vscode.window.activeTextEditor;

      if (editor && editor.selection.isEmpty) {
        // the Position object gives you the line and character where the cursor is
        const position = editor.selection.active;

        vscode.window.showInformationMessage("You're on line " + position.line);

        function lineIsBoring(line: vscode.TextLine) {
          return !/[a-zA-Z0-9]/.test(line.text);
        }

        function lineIsIndentationChange(
          prevLine: vscode.TextLine,
          currentLine: vscode.TextLine
        ) {
          return (
            prevLine.firstNonWhitespaceCharacterIndex !==
            currentLine.firstNonWhitespaceCharacterIndex
          );
        }

        function lineIsInteresting(currentLine: vscode.TextLine) {
          if (lineIsBoring(currentLine)) {
            return false;
          }

          const prevLine = editor?.document.lineAt(currentLine.lineNumber - 1);

          if (!prevLine) return false;

          return (
            lineIsIndentationChange(prevLine, currentLine) ||
            lineIsBoring(prevLine)
          );
        }

        var currentLineNumber = position.line;
        var currentLine: vscode.TextLine | null = null;

        while (currentLineNumber < editor.document.lineCount - 1) {
          currentLineNumber++;

          currentLine = editor.document.lineAt(currentLineNumber);

          if (lineIsInteresting(currentLine)) {
            break;
          }
        }

        const column = currentLine?.firstNonWhitespaceCharacterIndex || 0;

        editor.selection = new vscode.Selection(
          new vscode.Position(currentLineNumber, column),
          new vscode.Position(currentLineNumber, column)
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
