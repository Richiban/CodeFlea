import * as vscode from "vscode";

class Input {
  text: string;
  validateInput: (text: string) => string;
  resolve: (text: string) => void;
  reject: (reason: any) => void;

  constructor(options: {
    validateInput: (text: string) => string;
    resolve: (text: string) => void;
    reject: (reason: any) => void;
  }) {
    this.text = "";
    this.validateInput = options.validateInput;
    this.resolve = options.resolve;
    this.reject = options.reject;
  }
}

export class InlineInput {
  private subscriptions: vscode.Disposable[] = [];
  private input!: Input;
  static instances: InlineInput[] = [];
  private editor!: vscode.TextEditor;

  constructor() {
    this.registerTextEditorCommand("codeFlea.input.cancel", this.cancel);
    InlineInput.instances.push(this);
  }

  show = (
    editor: vscode.TextEditor,
    validateInput: (text: string) => string,
    placeHolder = "type the character to goto"
  ): Promise<string> => {
    this.editor = editor;
    this.setContext(true);

    try {
      this.registerCommand("type", this.onType);
    } catch (e) {
      const ct = new vscode.CancellationTokenSource();
      vscode.window
        .showInputBox(
          {
            placeHolder: placeHolder,
            prompt: "codeFlea ",
            validateInput: s => {
              if (!s) return "";
              this.onType({ text: s });
              ct.cancel();
              return null;
            }
          },
          ct.token
        )
        .then(s => {
          this.cancel(editor);
        });
    }

    return new Promise<string>((resolve, reject) => {
      this.input = new Input({
        validateInput: validateInput,
        resolve: resolve,
        reject: reject
      });
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.cancel(editor);
      });
    });
  };

  private onType = (event: { text: string }) => {
    const editor = vscode.window.activeTextEditor;

    if (this.input) {
      this.input.text += event.text;
      this.input.validateInput(this.input.text);
      this.complete(editor!);
    } else vscode.commands.executeCommand("default:type", event);
  };

  private dispose = () => {
    this.subscriptions.forEach(d => d.dispose());
    const i = InlineInput.instances.indexOf(this);
    if (i > -1) InlineInput.instances.splice(i, 1);
  };

  private registerTextEditorCommand = (
    commandId: string,
    run: (
      editor: vscode.TextEditor,
      edit: vscode.TextEditorEdit,
      ...args: any[]
    ) => void
  ): void => {
    this.subscriptions.push(
      vscode.commands.registerTextEditorCommand(commandId, run)
    );
  };

  private registerCommand = (
    commandId: string,
    run: (...args: any[]) => void
  ): void => {
    this.subscriptions.push(vscode.commands.registerCommand(commandId, run));
  };

  private complete = (editor: vscode.TextEditor) => {
    if (this.input) {
      this.input.resolve(this.input.text);
    }
    this.dispose();
    this.setContext(false);
  };

  private setContext(value: boolean) {
    vscode.commands.executeCommand("setContext", "codeFleaInput", value);
  }

  private cancel = (editor: vscode.TextEditor) => {
    if (this.input) {
      this.input.reject("canceled");
    }
    this.dispose();
    this.setContext(false);
  };

  public cancelInput() {
    this.cancel(this.editor);
  }
}
