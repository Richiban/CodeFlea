import { Config } from "./config";
import { JumpInterface } from "./jump-interface";
import * as vscode from "vscode";
import { moveCursorTo } from "./editor";
import { JumpLocations, JumpLocation, getJumpCodes } from "./common";
import { getBlocks } from "./lines";
import { getInterestingPoints } from "./points";

export class FleaJumper {
  private config: Config;
  private isJumping: boolean = false;
  private jumpInterface: JumpInterface;

  constructor(context: vscode.ExtensionContext, config: Config) {
    const disposables: vscode.Disposable[] = [];
    this.config = config;
    this.jumpInterface = new JumpInterface(config);

    this.jumpInterface.update(this.config);
  }

  updateConfig = (config: Config) => {
    this.jumpInterface.update(config);
  };

  private done() {
    this.isJumping = false;
  }

  private cancel() {
    this.isJumping = false;
  }

  async jump(): Promise<void> {
    let jumpTimeoutId: NodeJS.Timeout | null = null;

    if (this.isJumping) {
      throw new Error("CodeFlea: reinvoke goto command");
    }

    try {
      await this.jump();
      this.done();
      vscode.window.setStatusBarMessage("CodeFlea: Jumped!", 2000);
    } catch (err) {
      this.cancel();
      console.log("codeFlea: " + err);
    }

    this.isJumping = true;

    jumpTimeoutId = setTimeout(() => {
      jumpTimeoutId = null;
      this.cancel();
    }, this.config.jump.timeout);

    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const msg = "CodeFlea: Type To Jump";

    const messageDisposable = vscode.window.setStatusBarMessage(msg);

    try {
      await this.jumpToLinePhase(editor);

      await this.jumpToPointPhase(editor);
    } catch (reason) {
      if (!reason) reason = "Canceled!";
      vscode.window.setStatusBarMessage(`CodeFlea: ${reason}`, 2000);
    } finally {
      if (jumpTimeoutId) clearTimeout(jumpTimeoutId);
      messageDisposable.dispose();
    }
  }

  private jumpToLinePhase = async (editor: vscode.TextEditor) => {
    const jumpLines = this.findJumpLines(editor);

    const chosenLine = await this.jumpInterface.getUserSelection(
      editor,
      jumpLines,
      "primary"
    );

    if (chosenLine.tag === "Cancelled") return;

    if (chosenLine.tag === "Ok") {
      moveCursorTo(
        chosenLine.userSelection.lineNumber,
        chosenLine.userSelection.charIndex
      );
    }
  };

  private jumpToPointPhase = async (editor: vscode.TextEditor) => {
    const jumpPoints = this.findJumpPoints(editor);

    const chosenPoint = await this.jumpInterface.getUserSelection(
      editor,
      jumpPoints,
      "secondary"
    );

    if (chosenPoint.tag === "Ok") {
      moveCursorTo(
        chosenPoint.userSelection.lineNumber,
        chosenPoint.userSelection.charIndex
      );
    }
  };

  private findJumpPoints = (editor: vscode.TextEditor): JumpLocations => {
    const interestingPoints = getInterestingPoints();
    const jumpCodes = getJumpCodes(this.config);

    const { start: viewportStart, end: viewportEnd } = editor.visibleRanges[0];

    const inBounds = (loc: JumpLocation) =>
      loc.lineNumber >= viewportStart.line &&
      loc.lineNumber <= viewportEnd.line;

    const toJumpLocation = ([l, c]: readonly [
      { lineNumber: number; charIndex: number },
      string
    ]): JumpLocation => ({
      jumpCode: c,
      lineNumber: l.lineNumber,
      charIndex: l.charIndex,
    });

    return interestingPoints
      .zipWith(jumpCodes)
      .map(toJumpLocation)
      .takeWhile(inBounds)
      .toArray();
  };

  private findJumpLines = (editor: vscode.TextEditor): JumpLocations => {
    const bounds = editor.visibleRanges[0];
    const jumpCodes = getJumpCodes(this.config);

    const blocks = getBlocks("alternate", "forwards", bounds);

    const toJumpLocation = ([l, c]: readonly [
      vscode.TextLine,
      string
    ]): JumpLocation => ({
      jumpCode: c,
      lineNumber: l.lineNumber,
      charIndex: l.firstNonWhitespaceCharacterIndex,
    });

    return blocks.zipWith(jumpCodes).map(toJumpLocation).toArray();
  };
}
