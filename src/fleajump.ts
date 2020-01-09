import { Config } from "./config";
import { JumpInterface } from "./jump-interface";
import * as vscode from "vscode";
import { moveCursorTo } from "./editor";
import lines from "./lines";
import { InlineInput } from "./inline-input";
import { JumpLocations, JumpLocation } from "./common";

type Selection = {
  text: string;
  startLine: number;
  lastLine: number;
};

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
    while (InlineInput.instances.length > 0) {
      InlineInput.instances[0].cancelInput();
    }
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

    var { start: viewportStart, end: viewportEnd } = editor.visibleRanges[0];

    const toJumpLocation = ([l, c]: readonly [vscode.TextLine, string]) => {
      return {
        jumpCode: c,
        lineNumber: l.lineNumber,
        charIndex: l.firstNonWhitespaceCharacterIndex
      };
    };

    const inBounds = (loc: JumpLocation) =>
      loc.lineNumber >= viewportStart.line &&
      loc.lineNumber <= viewportEnd.line;

    const forwardLocations = linq(interestingLinesForwards)
      .zip(jumpCodes)
      .map(toJumpLocation)
      .takeWhile(inBounds)
      .toArray();

    const backwardLocations = linq(interestingLinesBackwards)
      .zip(jumpCodes)
      .map(toJumpLocation)
      .takeWhile(inBounds)
      .toArray();

    return { focusLine, forwardLocations, backwardLocations };
  };
}

function linq<T>(i: Generator<T>) {
  return new Linq(i);
}

class Linq<T> {
  constructor(private iter: Generator<T>) {}

  map<R>(f: (x: T) => R): Linq<R> {
    const iter = this.iter;

    return new Linq(
      (function*() {
        for (const x of iter) {
          yield f(x);
        }
      })()
    );
  }

  takeWhile(f: (x: T) => boolean): Linq<T> {
    const iter = this.iter;
    return new Linq(
      (function*() {
        for (const x of iter) {
          if (f(x) === false) return;

          yield x;
        }
      })()
    );
  }

  zip<T2>(iter2: Iterator<T2>) {
    const iter = this.iter;
    return new Linq(
      (function*() {
        while (true) {
          const lResult = iter.next();
          const rResult = iter2.next();

          if (lResult.done || rResult.done) {
            return;
          } else {
            yield [lResult.value, rResult.value] as const;
          }
        }
      })()
    );
  }

  toArray() {
    return Array.from(this.iter);
  }
}
