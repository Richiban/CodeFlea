import { Config } from "./config";
import { JumpInterface } from "./jump-interface";
import * as vscode from "vscode";
import { moveCursorTo } from "./editor";
import { JumpLocations, JumpLocation } from "./common";
import { getInterestingLines, lineIsBoring } from "./lines";
import { getInterestingPoints } from "./points";

export class FleaJumper {
  private config: Config;
  private isJumping: boolean = false;
  private jumpInterface: JumpInterface;

  constructor(context: vscode.ExtensionContext, config: Config) {
    let disposables: vscode.Disposable[] = [];
    this.config = config;
    this.jumpInterface = new JumpInterface(config, {}, {});

    disposables.push(
      vscode.commands.registerCommand("codeFlea.jump", async () => {
        try {
          await this.jump();
          this.done();
          vscode.window.setStatusBarMessage("CodeFlea: Jumped!", 2000);
        } catch (err) {
          this.cancel();
          console.log("codeFlea: " + err);
        }
      })
    );

    for (const disposable of disposables) {
      context.subscriptions.push(disposable);
    }

    this.jumpInterface.initialize(this.config);
  }

  updateConfig = () => {
    this.jumpInterface.initialize(this.config);
  };

  private done() {
    this.isJumping = false;
  }

  private cancel() {
    this.isJumping = false;
  }

  private async jump(): Promise<void> {
    let jumpTimeoutId: NodeJS.Timeout | null = null;

    if (this.isJumping) {
      throw new Error("CodeFlea: reinvoke goto command");
    }

    this.isJumping = true;

    jumpTimeoutId = setTimeout(() => {
      jumpTimeoutId = null;
      this.cancel();
    }, this.config.jumper.timeout);

    let editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    let msg = "CodeFlea: Type To Jump";

    let messageDisposable = vscode.window.setStatusBarMessage(msg);

    try {
      const jumpLines = this.findJumpLines(editor);

      const chosenLine = await this.jumpInterface.pick(
        editor,
        jumpLines,
        "primary"
      );

      if (chosenLine) moveCursorTo(chosenLine.lineNumber, chosenLine.charIndex);

      const jumpPoints = this.findJumpPoints(editor);

      const chosenPoint = await this.jumpInterface.pick(
        editor,
        jumpPoints,
        "secondary"
      );

      if (chosenPoint)
        moveCursorTo(chosenPoint.lineNumber, chosenPoint.charIndex);
    } catch (reason) {
      if (!reason) reason = "Canceled!";
      vscode.window.setStatusBarMessage(`CodeFlea: ${reason}`, 2000);
    } finally {
      if (jumpTimeoutId) clearTimeout(jumpTimeoutId);
      messageDisposable.dispose();
    }
  }

  private *getJumpCodes() {
    for (const c of this.config.jumper.characters) {
      yield c;
    }
  }

  private findJumpPoints = (editor: vscode.TextEditor): JumpLocations => {
    const interestingPoints = getInterestingPoints();
    const jumpCodes = this.getJumpCodes();

    const { start: viewportStart, end: viewportEnd } = editor.visibleRanges[0];

    const inBounds = (loc: JumpLocation) =>
      loc.lineNumber >= viewportStart.line &&
      loc.lineNumber <= viewportEnd.line;

    const toJumpLocation = ([l, c]: readonly [
      { lineNumber: number; charIndex: number },
      string
    ]): JumpLocation => {
      return {
        jumpCode: c,
        lineNumber: l.lineNumber,
        charIndex: l.charIndex
      };
    };

    const locations = interestingPoints
      .zipWith(jumpCodes)
      .map(toJumpLocation)
      .takeWhile(inBounds)
      .toArray();

    return locations;
  };

  private findJumpLines = (editor: vscode.TextEditor): JumpLocations => {
    const interestingLines = getInterestingLines("alternate", "forwards");
    const jumpCodes = this.getJumpCodes();

    const { start: viewportStart, end: viewportEnd } = editor.visibleRanges[0];

    const inBounds = (loc: JumpLocation) =>
      loc.lineNumber >= viewportStart.line &&
      loc.lineNumber <= viewportEnd.line;

    const toJumpLocation = ([l, c]: readonly [
      vscode.TextLine,
      string
    ]): JumpLocation => {
      return {
        jumpCode: c,
        lineNumber: l.lineNumber,
        charIndex: l.firstNonWhitespaceCharacterIndex
      };
    };

    const locations = interestingLines
      .zipWith(jumpCodes)
      .map(toJumpLocation)
      .takeWhile(inBounds)
      .toArray();

    return locations;
  };
}
