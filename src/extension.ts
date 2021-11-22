// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FleaJumper } from "./fleajump";
import {
  nextBlock,
  moveToChangeOfIndentation,
  moveToSameLine,
  extendBlockSelection,
  nextBlankLine,
  nextBlockEnd,
} from "./lines";
import { nextInterestingPoint } from "./points";
import { loadConfig } from "./config";
import { scrollToCursorAtCenter } from "./editor";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextBlock", () =>
      nextBlock("forwards", "any-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.extendBlockSelection", () =>
      extendBlockSelection("forwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextOuterBlock", () =>
      nextBlock("forwards", "less-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevOuterBlock", () =>
      nextBlock("backwards", "less-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextSameBlock", () =>
      nextBlock("forwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevSameBlock", () =>
      nextBlock("backwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInnerBlock", () =>
      nextBlock("forwards", "greater-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInnerBlock", () =>
      nextBlock("backwards", "greater-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevBlock", () =>
      nextBlock("backwards", "any-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.extendBlockSelectionBackwards",
      () => extendBlockSelection("backwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextBlankLine", () =>
      nextBlankLine("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevBlankLine", () =>
      nextBlankLine("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nearestInnerLine", () =>
      moveToChangeOfIndentation("greaterThan", "nearest")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nearestOuterLine", () =>
      moveToChangeOfIndentation("lessThan", "nearest")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInnerLine", () =>
      moveToChangeOfIndentation("greaterThan", "forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevOuterLine", () =>
      moveToChangeOfIndentation("lessThan", "backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextSameLine", () =>
      moveToSameLine("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevSameLine", () =>
      moveToSameLine("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInterestingPoint", () =>
      nextInterestingPoint("backwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInterestingPoint", () =>
      nextInterestingPoint("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.scrollToCursor", () =>
      scrollToCursorAtCenter()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextBlockEnd", () =>
      nextBlockEnd("forwards", "any-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevBlockEnd", () =>
      nextBlockEnd("backwards", "any-indentation")
    )
  );

  const fleaJumper = new FleaJumper(context, loadConfig());

  vscode.workspace.onDidChangeConfiguration((_) => {
    fleaJumper.updateConfig(loadConfig());
  });
}

export function deactivate() {}
