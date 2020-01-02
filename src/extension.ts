// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import lines from "./lines";
import points from "./points";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInterestingLine", () =>
      lines.moveToNextInterestingLine("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInterestingLine", () =>
      lines.moveToNextInterestingLine("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.nearestLineOfGreaterIndentation",
      () => lines.moveToChangeOfIndentation("greaterThan", "nearest")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.nearestLineOfLesserIndentation",
      () => lines.moveToChangeOfIndentation("lessThan", "nearest")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.nextLineOfGreaterIndentation",
      () => lines.moveToChangeOfIndentation("greaterThan", "forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.prevLineOfLesserIndentation",
      () => lines.moveToChangeOfIndentation("lessThan", "backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextLineOfSameIndentation", () =>
      lines.moveToLineOfSameIndentation("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevLineOfSameIndentation", () =>
      lines.moveToLineOfSameIndentation("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInterestingPoint", () =>
      points.moveToInterestingPoint("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInterestingPoint", () =>
      points.moveToInterestingPoint("forwards")
    )
  );
}

export function deactivate() {}
