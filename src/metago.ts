import { Config } from "./config";
import {
  DecorationModel,
  DecorationModelBuilder,
  ILineCharIndexes,
  CharIndex
} from "./decoration-model";
import { Decorator } from "./decoration";
import * as vscode from "vscode";
import editor from "./editor";
import { InlineInput } from "./inline-input";

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

export class FleaJumper {
  private config: Config;
  private decorationModelBuilder: DecorationModelBuilder = new DecorationModelBuilder();
  private decorator: Decorator;
  private isJumping: boolean = false;
  private viewPort: ViewPort;
  private findFromCenterScreenRange: number;
  private halfViewPortRange: number;
  private currentFindIndex = -1;
  private decorationModels: DecorationModel[] = [];

  constructor(context: vscode.ExtensionContext, config: Config) {
    let disposables: vscode.Disposable[] = [];
    this.config = config;
    this.viewPort = new ViewPort();
    this.halfViewPortRange = Math.trunc(this.config.jumper.range / 2); // 0.5
    // determines whether to find from center of the screen.
    this.findFromCenterScreenRange = Math.trunc(
      (this.config.jumper.range * 2) / 5
    ); // 0.4

    this.decorator = new Decorator(config, {}, {}, null);

    disposables.push(
      vscode.commands.registerCommand("codeFlea.jump", () => {
        try {
          this.jump()!
            .then(model => {
              this.done();
              editor.moveCursorTo(model.line, model.character + 1);
            })
            .catch(() => this.cancel());
        } catch (err) {
          this.cancel();
          console.log("codeFlea: " + err);
        }
      })
    );

    for (let i = 0; i < disposables.length; i++) {
      context.subscriptions.push(disposables[i]);
    }

    this.decorationModelBuilder.initialize(this.config);
    this.decorator.initialize(this.config);
  }

  updateConfig = () => {
    this.decorator.initialize(this.config);
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

  private jump() {
    let editor = vscode.window.activeTextEditor!;

    if (!editor) return;

    let jumpTimeoutId: NodeJS.Timeout | null = null;

    if (!this.isJumping) {
      this.isJumping = true;

      jumpTimeoutId = setTimeout(() => {
        jumpTimeoutId = null;
        this.cancel();
      }, this.config.jumper.timeout);

      return new Promise<DecorationModel>((resolve, reject) => {
        return this.jump2((editor, model: any) => {
          resolve(model);
        })
          .then(() => {
            if (jumpTimeoutId) clearTimeout(jumpTimeoutId);
          })
          .catch(() => {
            if (jumpTimeoutId) clearTimeout(jumpTimeoutId);
            reject();
          });
      });
    } else {
      return new Promise<DecorationModel>((resolve, reject) => {
        reject("CodeFlea: reinvoke goto command");
      });
    }
  }

  private jump2 = (
    jumped: (editor: vscode.TextEditor, model: DecorationModel) => void
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      let editor = vscode.window.activeTextEditor;

      if (!editor) {
        reject();
        return;
      }

      let msg = "CodeFlea: Type To Jump";

      let messageDisposable = vscode.window.setStatusBarMessage(msg);

      const promise = new Promise<DecorationModel>((resolve, reject) => {
        this.decorator.addCommandIndicator(editor!);
        return this.getFirstInput(editor!, resolve, reject);
      })
        .then((model: DecorationModel) => {
          jumped(editor!, model);
          let msg = "CodeFlea: Jumped!";
          vscode.window.setStatusBarMessage(msg, 2000);
          resolve();
        })
        .catch((reason?: string) => {
          this.decorator.removeCommandIndicator(editor!);
          if (!reason) reason = "Canceled!";
          vscode.window.setStatusBarMessage(`CodeFlea: ${reason}`, 2000);
          messageDisposable.dispose();
          reject();
        });
    });
  };

  private getFirstInput = (
    editor: vscode.TextEditor,
    resolve: any,
    reject: any
  ): Promise<void> => {
    let firstInlineInput = new InlineInput()
      .show(editor, (v: any) => {
        this.decorator.removeCommandIndicator(editor);
        return v;
      })
      .then((value: string) => {
        if (!value) {
          reject();
          return;
        }

        if (
          value === " " &&
          this.currentFindIndex !== Number.NaN &&
          this.decorationModels
        ) {
          let model = this.decorationModels.find(
            model => model.indexInModels === this.currentFindIndex + 1
          );
          if (model) {
            resolve(model);
            this.currentFindIndex++;
            return;
          }
          reject();
          return;
        } else if (
          value === "\n" &&
          this.currentFindIndex !== Number.NaN &&
          this.decorationModels
        ) {
          let model = this.decorationModels.find(
            model => model.indexInModels === this.currentFindIndex - 1
          );
          if (model) {
            resolve(model);
            this.currentFindIndex--;
          }
          reject();
          return;
        }

        if (value && value.length > 1) value = value.substring(0, 1);

        this.getSelection(editor)
          .then(selection => {
            let lineCharIndexes = this.find(
              editor,
              selection.before,
              selection.after,
              value
            );
            if (lineCharIndexes.count <= 0) {
              reject("CodeFlea: no matches");
              return;
            }

            this.decorationModels = this.decorationModelBuilder.buildDecorationModel(
              lineCharIndexes
            );

            if (this.decorationModels.length === 0) {
              reject("CodeFlea: encoding error");
              return;
            }
            if (this.decorationModels.length === 1) {
              resolve(this.decorationModels[0]);
            } else {
              this.prepareForJumpTo(editor, this.decorationModels)
                .then(model => {
                  resolve(model);
                })
                .catch(e => {
                  reject(e);
                });
            }
          })
          .catch(e => reject(e));
      })
      .catch(reject);

    return firstInlineInput;
  };

  private async getSelection(
    editor: vscode.TextEditor
  ): Promise<{ before: Selection; after: Selection }> {
    let selection: Selection = EmptySelection();

    if (
      !editor.selection.isEmpty &&
      this.config.jumper.findInSelection === "on"
    ) {
      selection.text = editor.document.getText(editor.selection);

      if (editor.selection.anchor.line > editor.selection.active.line) {
        selection.startLine = editor.selection.active.line;
        selection.lastLine = editor.selection.anchor.line;
      } else {
        selection.startLine = editor.selection.anchor.line;
        selection.lastLine = editor.selection.active.line;
      }
      selection.lastLine++;
      return { before: selection, after: EmptySelection() };
    } else {
      await this.getPosition();
      selection.startLine = Math.max(
        editor.selection.active.line - this.config.jumper.range,
        0
      );
      selection.lastLine = editor.selection.active.line + 1; //current line included in before
      selection.text = editor.document.getText(
        new vscode.Range(selection.startLine, 0, selection.lastLine, 0)
      );

      let selectionAfter = EmptySelection();
      selectionAfter.startLine = editor.selection.active.line + 1;
      selectionAfter.lastLine = Math.min(
        editor.selection.active.line + this.config.jumper.range,
        editor.document.lineCount
      );
      selectionAfter.text = editor.document.getText(
        new vscode.Range(
          selectionAfter.startLine,
          0,
          selectionAfter.lastLine,
          0
        )
      );

      return { before: selection, after: selectionAfter };
    }
  }

  private find = (
    editor: vscode.TextEditor,
    selectionBefore: Selection,
    selectionAfter: Selection,
    value: string
  ): ILineCharIndexes => {
    let lineIndexes: ILineCharIndexes = {
      count: 0,
      focusLine: 0,
      indexes: {}
    };

    for (let i = selectionBefore.startLine; i < selectionBefore.lastLine; i++) {
      let line = editor.document.lineAt(i);
      let indexes = this.indexesOf(line.text, value);
      lineIndexes.count += indexes.length;
      lineIndexes.indexes[i] = indexes;
    }
    lineIndexes.focusLine = editor.selection.active.line;

    for (let i = selectionAfter.startLine; i < selectionAfter.lastLine; i++) {
      let line = editor.document.lineAt(i);
      let indexes = this.indexesOf(line.text, value);
      lineIndexes.count += indexes.length;
      lineIndexes.indexes[i] = indexes;
    }
    return lineIndexes;
  };

  private indexesOf = (str: string, char: string): CharIndex[] => {
    if (char && char.length === 0) {
      return [];
    }

    let indices = [];
    let ignoreCase = this.config.jumper.targetIgnoreCase;
    if (this.config.jumper.findAllMode === "on") {
      for (var i = 0; i < str.length; i++) {
        if (!ignoreCase) {
          if (str[i] === char) {
            indices.push(new CharIndex(i));
          }
        } else {
          if (str[i] && str[i].toLowerCase() === char.toLowerCase()) {
            indices.push(new CharIndex(i));
          }
        }
      }
    } else {
      //splitted by spaces
      let words = str.split(
        new RegExp(this.config.jumper.wordSeparatorPattern)
      );
      //current line index
      let index = 0;

      for (var i = 0; i < words.length; i++) {
        if (!ignoreCase) {
          if (words[i][0] === char) {
            indices.push(new CharIndex(index));
          }
        } else {
          if (words[i][0] && words[i][0].toLowerCase() === char.toLowerCase()) {
            indices.push(new CharIndex(index));
          }
        }
        // increment by word and white space
        index += words[i].length + 1;
      }
    }
    return indices;
  };

  private prepareForJumpTo = (
    editor: vscode.TextEditor,
    models: DecorationModel[]
  ) => {
    return new Promise<DecorationModel>((resolve, reject) => {
      this.decorator.addDecorations(editor, models);
      let msg = "CodeFlea: Jump To";
      let messageDisposable = vscode.window.setStatusBarMessage(msg);
      new InlineInput()
        .show(editor, (v: any) => v)
        .then((value: string) => {
          this.decorator.removeDecorations(editor);
          if (!value) return;

          if (value === "\n") {
            let model = models.find(model => model.indexInModels === 0);
            if (model) {
              this.currentFindIndex = 0;
              resolve(model);
            }
          } else if (value === " ") {
            let model = models.find(model => model.indexInModels === 1);
            if (model) {
              this.currentFindIndex = 1;
              resolve(model);
            }
          }

          let model = models.find(
            model =>
              model.code[0] &&
              model.code[0].toLowerCase() === value.toLowerCase()
          );

          if (model && model.children.length > 1) {
            this.prepareForJumpTo(editor, model.children)
              .then(model => {
                this.decorator.removeDecorations(editor);
                resolve(model);
              })
              .catch(() => {
                this.decorator.removeDecorations(editor);
                reject();
              });
          } else if (model) {
            resolve(model);
            this.currentFindIndex = model.indexInModels;
          }
        })
        .catch(() => {
          this.decorator.removeDecorations(editor);
          messageDisposable.dispose();
          reject();
        });
    });
  };
}
