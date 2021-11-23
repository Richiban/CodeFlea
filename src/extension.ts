// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FleaJumper } from "./fleajump";
import {
  nextBlockStart,
  moveToChangeOfIndentation,
  moveToNextLineSameLevel,
  extendBlockSelection,
  nextBlankLine,
  nextBlockEnd,
  selectAllBlocksInCurrentScope,
} from "./lines";
import { nextInterestingPoint } from "./points";
import { loadConfig } from "./config";
import { scrollEditor, scrollToCursorAtCenter } from "./editor";

export function activate(context: vscode.ExtensionContext) {
  const config = loadConfig();
  const fleaJumper = new FleaJumper(context, config);

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.jump", () => fleaJumper.jump())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextBlock", () =>
      nextBlockStart("forwards", "any-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.extendBlockSelection", () =>
      extendBlockSelection("forwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextOuterBlock", () =>
      nextBlockStart("forwards", "less-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevOuterBlock", () =>
      nextBlockStart("backwards", "less-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextSameBlock", () =>
      nextBlockStart("forwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevSameBlock", () =>
      nextBlockStart("backwards", "same-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.nextInnerBlock", () =>
      nextBlockStart("forwards", "more-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevInnerBlock", () =>
      nextBlockStart("backwards", "more-indentation")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevBlock", () =>
      nextBlockStart("backwards", "any-indentation")
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
      moveToNextLineSameLevel("forwards")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.prevSameLine", () =>
      moveToNextLineSameLevel("backwards")
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

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.scrollEditorUp", () =>
      scrollEditor("up", config.scrollStep)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("codeFlea.scrollEditorDown", () =>
      scrollEditor("down", config.scrollStep)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "codeFlea.selectAllBlocksInCurrentScope",
      () => selectAllBlocksInCurrentScope()
    )
  );

  vscode.workspace.onDidChangeConfiguration((_) => {
    fleaJumper.updateConfig(loadConfig());
  });
}

export function deactivate() {}
