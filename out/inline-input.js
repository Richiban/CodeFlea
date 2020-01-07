"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Input {
    constructor(options) {
        this.text = "";
        this.validateInput = options.validateInput;
        this.resolve = options.resolve;
        this.reject = options.reject;
    }
}
class InlineInput {
    constructor() {
        this.subscriptions = [];
        this.show = (editor, validateInput, placeHolder = "type the character to goto") => {
            this.editor = editor;
            this.setContext(true);
            try {
                this.registerCommand("type", this.onType);
            }
            catch (e) {
                const ct = new vscode.CancellationTokenSource();
                vscode.window
                    .showInputBox({
                    placeHolder: placeHolder,
                    prompt: "codeFlea ",
                    validateInput: s => {
                        if (!s)
                            return "";
                        this.onType({ text: s });
                        ct.cancel();
                        return null;
                    }
                }, ct.token)
                    .then(s => {
                    this.cancel(editor);
                });
            }
            return new Promise((resolve, reject) => {
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
        this.onType = (event) => {
            const editor = vscode.window.activeTextEditor;
            if (this.input) {
                this.input.text += event.text;
                this.input.validateInput(this.input.text);
                this.complete(editor);
            }
            else
                vscode.commands.executeCommand("default:type", event);
        };
        this.dispose = () => {
            this.subscriptions.forEach(d => d.dispose());
            const i = InlineInput.instances.indexOf(this);
            if (i > -1)
                InlineInput.instances.splice(i, 1);
        };
        this.registerTextEditorCommand = (commandId, run) => {
            this.subscriptions.push(vscode.commands.registerTextEditorCommand(commandId, run));
        };
        this.registerCommand = (commandId, run) => {
            this.subscriptions.push(vscode.commands.registerCommand(commandId, run));
        };
        this.complete = (editor) => {
            if (this.input) {
                this.input.resolve(this.input.text);
            }
            this.dispose();
            this.setContext(false);
        };
        this.cancel = (editor) => {
            if (this.input) {
                this.input.reject("canceled");
            }
            this.dispose();
            this.setContext(false);
        };
        this.registerTextEditorCommand("codeFlea.input.cancel", this.cancel);
        InlineInput.instances.push(this);
    }
    setContext(value) {
        vscode.commands.executeCommand("setContext", "codeFleaInput", value);
    }
    cancelInput() {
        this.cancel(this.editor);
    }
}
exports.InlineInput = InlineInput;
InlineInput.instances = [];
//# sourceMappingURL=inline-input.js.map