// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FleaJumper } from "./fleajump";
import {
  moveToNextBlock,
  moveToChangeOfIndentation,
  moveToLineOfSameIndentation,
  extendBlockSelection,
  moveToNextBlankLine,
} from "./lines";
import { moveToNextInterestingPoint } from "./points";
import { loadConfig } from "./config";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.moveToNextBlock", () =>
      moveToNextBlock("forwards", "any-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.extendBlockSelection", () =>
      extendBlockSelection("forwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.moveToNextBlockOfSameIndentation",
      () => moveToNextBlock("forwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.moveToPrevBlock", () =>
      moveToNextBlock("backwards", "any-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.moveToPrevBlockOfSameIndentation",
      () => moveToNextBlock("backwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.extendBlockSelectionBackwards",
      () => extendBlockSelection("backwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.moveToNextBlankLine", () =>
      moveToNextBlankLine("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.moveToPrevBlankLine", () =>
      moveToNextBlankLine("backwards")
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

  const fleaJumper = new FleaJumper(context, loadConfig());

  vscode.workspace.onDidChangeConfiguration((_) => {
    fleaJumper.updateConfig(loadConfig());
  });
}

export function deactivate() {}
