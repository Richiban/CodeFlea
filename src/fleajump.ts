import { Config } from "./config";
import { JumpInterface } from "./jump-interface";
import * as vscode from "vscode";
import { moveCursorTo } from "./editor";
import lines from "./lines";
import { InlineInput } from "./inline-input";
import { zip, JumpLocations } from "./common";

function EmptySelection(): Selection {
  return { text: "", startLine: 0, lastLine: 0 };
}

type Selection = {
  text: string;
  startLine: number;
  lastLine: number;
};

export class ViewPort {
  async moveCursorToCenter(select: boolean) {
    await vscode.commands.executeCommand("cursorMove", {
      to: "viewPortCenter",
      select: select
    });
  }
}

type SelectionRange = { selectionBefore: Selection; selectionAfter: Selection };

export class FleaJumper {
  private config: Config;
  private isJumping: boolean = false;
  private viewPort: ViewPort;
  private findFromCenterScreenRange: number;
  private jumpInterface: JumpInterface;

  constructor(context: vscode.ExtensionContext, config: Config) {
    let disposables: vscode.Disposable[] = [];
    this.config = config;
    this.viewPort = new ViewPort();
    //this.halfViewPortRange = Math.trunc(this.config.jumper.range / 2); // 0.5
    // determines whether to find from center of the screen.
    this.findFromCenterScreenRange = Math.trunc(
      (this.config.jumper.range * 2) / 5
    ); // 0.4

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
    while (InlineInput.instances.length > 0) {
      InlineInput.instances[0].cancelInput();
    }
    this.isJumping = false;
  }

  private async getPosition() {
    let editor = vscode.window.activeTextEditor!;
    let fromLine = editor.selection.active.line;
    let fromChar = editor.selection.active.character;

    await this.viewPort.moveCursorToCenter(false);
    let toLine = editor.selection.active.line;
    let cursorMoveBoundary = this.findFromCenterScreenRange;

    if (Math.abs(toLine - fromLine) < cursorMoveBoundary) {
      // back
      editor.selection = new vscode.Selection(
        new vscode.Position(fromLine, fromChar),
        new vscode.Position(fromLine, fromChar)
      );
    }
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
      const locations = this.findJumpLocations(editor);

      const loc = await this.jumpInterface.pick(editor, locations);

      if (loc) moveCursorTo(loc.lineNumber, loc.charIndex);
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

  private findJumpLocations = (editor: vscode.TextEditor): JumpLocations => {
    const focusLine = editor.selection.active.line;

    const interestingLinesForwards = lines.interestingLines("forwards");
    const interestingLinesBackwards = lines.interestingLines("backwards");
    const jumpCodes = this.getJumpCodes();

    const forwardLocations = Array.from(
      zip(interestingLinesForwards, jumpCodes)
    ).map(([l, c]) => {
      return {
        jumpCode: c,
        lineNumber: l.lineNumber,
        charIndex: l.firstNonWhitespaceCharacterIndex
      };
    });

    const backwardLocations = Array.from(
      zip(interestingLinesBackwards, jumpCodes)
    ).map(([l, c]) => {
      return {
        jumpCode: c,
        lineNumber: l.lineNumber,
        charIndex: l.firstNonWhitespaceCharacterIndex
      };
    });

    return { focusLine, forwardLocations, backwardLocations };
  };
}
