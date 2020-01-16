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
const vscode = require("vscode");
const common_1 = require("./common");
const inline_input_1 = require("./inline-input");
class JumpInterface {
    constructor(config, cache, decorations = {}) {
        this.config = config;
        this.cache = cache;
        this.decorations = decorations;
        this.initialize = (config) => {
            this.config = config;
            this.updateCache();
        };
        this.createDecorationOptions = (line, char, code) => {
            return {
                range: new vscode.Range(line, char, line, char),
                renderOptions: {
                    dark: {
                        after: {
                            contentIconPath: this.getUri(code)
                        }
                    },
                    light: {
                        after: {
                            contentIconPath: this.getUri(code)
                        }
                    }
                }
            };
        };
        this.getUri = (code) => {
            if (this.cache[code] != undefined)
                return this.cache[code];
            this.cache[code] = this.buildUri(code);
            return this.cache[code];
        };
        this.updateCache = () => {
            this.cache = {};
            this.config.jumper.characters.forEach(code => (this.cache[code] = this.buildUri(code)));
        };
        this.buildUri = (code) => {
            const cf = this.config.decoration;
            const key = this.config.decoration.upperCase
                ? code.toUpperCase()
                : code.toLowerCase();
            const width = code.length * cf.width;
            const colors = cf.bgColor.split(",");
            const bgColor = "lime"; //colors[(code.length - 1) % colors.length];
            const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="2" ry="3" style="fill: ${bgColor};fill-opacity:1;stroke:${cf.borderColor};stroke-opacity:${cf.bgOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;
            return vscode.Uri.parse(svg);
        };
    }
    pick(editor, jumpLocations) {
        return __awaiter(this, void 0, void 0, function* () {
            this.addDecorations(editor, jumpLocations);
            const input = yield new inline_input_1.InlineInput().show(editor, v => v);
            this.removeDecorations(editor);
            return jumpLocations.find(x => x.jumpCode === input);
        });
    }
    addDecorations(editor, jumpLocations) {
        const { _true: standardOptions, _false: optionsWithNoSpaceToLeft } = common_1.linqish(jumpLocations)
            .map(loc => this.createDecorationOptions(loc.lineNumber, loc.charIndex, loc.jumpCode))
            .partition(loc => loc.range.start.character > 0);
        editor.setDecorations(this.createTextEditorDecorationType(1), standardOptions);
        editor.setDecorations(this.createTextEditorDecorationType(0), optionsWithNoSpaceToLeft);
    }
    removeDecorations(editor) {
        for (const dec in this.decorations) {
            if (this.decorations[dec] === null)
                continue;
            editor.setDecorations(this.decorations[dec], []);
            this.decorations[dec].dispose();
            this.decorations[dec] = null;
        }
    }
    createTextEditorDecorationType(charsToOffsetToLeft) {
        let decorationType = this.decorations[charsToOffsetToLeft];
        if (decorationType)
            return decorationType;
        decorationType = vscode.window.createTextEditorDecorationType({
            after: {
                margin: `0 0 0 ${charsToOffsetToLeft *
                    -this.config.decoration.width}px`,
                height: `${this.config.decoration.height}px`,
                width: `${charsToOffsetToLeft * this.config.decoration.width}px`
            }
        });
        this.decorations[charsToOffsetToLeft] = decorationType;
        return decorationType;
    }
}
exports.JumpInterface = JumpInterface;
//# sourceMappingURL=jump-interface.js.map