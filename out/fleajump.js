"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const jump_interface_1 = require("./jump-interface");
const vscode = require("vscode");
const editor_1 = require("./editor");
const lines_1 = require("./lines");
const inline_input_1 = require("./inline-input");
const common_1 = require("./common");
function EmptySelection() {
    return { text: "", startLine: 0, lastLine: 0 };
}
class ViewPort {
    moveCursorToCenter(select) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.commands.executeCommand("cursorMove", {
                to: "viewPortCenter",
                select: select
            });
        });
    }
}
exports.ViewPort = ViewPort;
class FleaJumper {
    constructor(context, config) {
        this.isJumping = false;
        this.updateConfig = () => {
            this.jumpInterface.initialize(this.config);
        };
        this.findJumpLocations = (editor) => {
            const focusLine = editor.selection.active.line;
            const interestingLines = lines_1.default.interestingLines("forwards");
            const jumpCodes = this.getJumpCodes();
            const locations = Array.from(common_1.zip(interestingLines, jumpCodes)).map(([l, c]) => {
                return {
                    jumpCode: c,
                    lineNumber: l.lineNumber,
                    charIndex: l.firstNonWhitespaceCharacterIndex
                };
            });
            return { focusLine, locations };
        };
        let disposables = [];
        this.config = config;
        this.viewPort = new ViewPort();
        //this.halfViewPortRange = Math.trunc(this.config.jumper.range / 2); // 0.5
        // determines whether to find from center of the screen.
        this.findFromCenterScreenRange = Math.trunc((this.config.jumper.range * 2) / 5); // 0.4
        this.jumpInterface = new jump_interface_1.JumpInterface(config, {}, {});
        disposables.push(vscode.commands.registerCommand("codeFlea.jump", () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.jump();
                this.done();
                vscode.window.setStatusBarMessage("CodeFlea: Jumped!", 2000);
            }
            catch (err) {
                this.cancel();
                console.log("codeFlea: " + err);
            }
        })));
        for (const disposable of disposables) {
            context.subscriptions.push(disposable);
        }
        this.jumpInterface.initialize(this.config);
    }
    done() {
        this.isJumping = false;
    }
    cancel() {
        while (inline_input_1.InlineInput.instances.length > 0) {
            inline_input_1.InlineInput.instances[0].cancelInput();
        }
        this.isJumping = false;
    }
    getPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            let editor = vscode.window.activeTextEditor;
            let fromLine = editor.selection.active.line;
            let fromChar = editor.selection.active.character;
            yield this.viewPort.moveCursorToCenter(false);
            let toLine = editor.selection.active.line;
            let cursorMoveBoundary = this.findFromCenterScreenRange;
            if (Math.abs(toLine - fromLine) < cursorMoveBoundary) {
                // back
                editor.selection = new vscode.Selection(new vscode.Position(fromLine, fromChar), new vscode.Position(fromLine, fromChar));
            }
        });
    }
    jump() {
        return __awaiter(this, void 0, void 0, function* () {
            let jumpTimeoutId = null;
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
                const loc = yield this.jumpInterface.pick(editor, locations);
                if (loc)
                    editor_1.moveCursorTo(loc.lineNumber, loc.charIndex);
            }
            catch (reason) {
                if (!reason)
                    reason = "Canceled!";
                vscode.window.setStatusBarMessage(`CodeFlea: ${reason}`, 2000);
            }
            finally {
                if (jumpTimeoutId)
                    clearTimeout(jumpTimeoutId);
                messageDisposable.dispose();
            }
        });
    }
    *getJumpCodes() {
        for (const c of this.config.jumper.characters) {
            yield c;
        }
    }
}
exports.FleaJumper = FleaJumper;
//# sourceMappingURL=fleajump.js.map