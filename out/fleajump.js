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
const inline_input_1 = require("./inline-input");
const lines_1 = require("./lines");
class FleaJumper {
    constructor(context, config) {
        this.isJumping = false;
        this.updateConfig = () => {
            this.jumpInterface.initialize(this.config);
        };
        this.findJumpLocations = (editor) => {
            const focusLine = editor.selection.active.line;
            const interestingLines = lines_1.getInterestingLines("alternate", "forwards");
            const jumpCodes = this.getJumpCodes();
            var { start: viewportStart, end: viewportEnd } = editor.visibleRanges[0];
            const inBounds = (loc) => loc.lineNumber >= viewportStart.line &&
                loc.lineNumber <= viewportEnd.line;
            const toJumpLocation = ([l, c]) => {
                return {
                    jumpCode: c,
                    lineNumber: l.lineNumber,
                    charIndex: l.firstNonWhitespaceCharacterIndex
                };
            };
            const locations = interestingLines
                .zip(jumpCodes)
                .map(toJumpLocation)
                .takeWhile(inBounds)
                .toArray();
            return { focusLine, locations };
        };
        let disposables = [];
        this.config = config;
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