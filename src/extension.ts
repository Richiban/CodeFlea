// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FleaJumper } from "./fleajump";
import { Config } from "./config";
import {
  moveToNextInterestingLine,
  moveToChangeOfIndentation,
  moveToLineOfSameIndentation
} from "./lines";
import { moveToNextInterestingPoint } from "./points";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInterestingLine", () =>
      moveToNextInterestingLine("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInterestingLine", () =>
      moveToNextInterestingLine("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.nearestLineOfGreaterIndentation",
      () => moveToChangeOfIndentation("greaterThan", "nearest")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.nearestLineOfLesserIndentation",
      () => moveToChangeOfIndentation("lessThan", "nearest")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.nextLineOfGreaterIndentation",
      () => moveToChangeOfIndentation("greaterThan", "forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.prevLineOfLesserIndentation",
      () => moveToChangeOfIndentation("lessThan", "backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextLineOfSameIndentation", () =>
      moveToLineOfSameIndentation("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevLineOfSameIndentation", () =>
      moveToLineOfSameIndentation("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInterestingPoint", () =>
      moveToNextInterestingPoint("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInterestingPoint", () =>
      moveToNextInterestingPoint("forwards")
    )
  );

  let config = new Config();
  config.loadConfig();

  const fleaJumper = new FleaJumper(context, config);

  vscode.workspace.onDidChangeConfiguration(_ => {
    config.loadConfig();
    fleaJumper.updateConfig();
  });
}

export function deactivate() {}
