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
        this.createDecorationOptions = (line, startCharacter, endCharacter, code) => {
            return {
                range: new vscode.Range(line, startCharacter, line, endCharacter),
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
            let cf = this.config.decoration;
            let key = this.config.decoration.upperCase
                ? code.toUpperCase()
                : code.toLowerCase();
            let width = code.length * cf.width;
            let colors = cf.bgColor.split(",");
            let bgColor = colors[(code.length - 1) % colors.length];
            let svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${cf.height}" height="${cf.height}" width="${width}"><rect width="${width}" height="${cf.height}" rx="2" ry="3" style="fill: ${bgColor};fill-opacity:${cf.bgOpacity};stroke:${cf.borderColor};stroke-opacity:${cf.bgOpacity};"/><text font-family="${cf.fontFamily}" font-weight="${cf.fontWeight}" font-size="${cf.fontSize}px" style="fill:${cf.color}" x="${cf.x}" y="${cf.y}">${key}</text></svg>`;
            return vscode.Uri.parse(svg);
        };
    }
    pick(editor, jumpLocations) {
        return __awaiter(this, void 0, void 0, function* () {
            this.addDecorations(editor, jumpLocations);
            const input = yield new inline_input_1.InlineInput().show(editor, v => v);
            this.removeDecorations(editor);
            return jumpLocations.locations.find(x => x.jumpCode === input);
        });
    }
    addDecorations(editor, jumpLocations) {
        const regular = this.createTextEditorDecorationType(1);
        const beginning = this.createTextEditorDecorationType(0);
        const { _true: options1, _false: options2 } = common_1.linqish(jumpLocations.locations).partition(loc => loc.charIndex > 0);
        const x = options1.map(loc => this.createDecorationOptions(loc.lineNumber, loc.charIndex, loc.charIndex, loc.jumpCode));
        const y = options2.map(loc => this.createDecorationOptions(loc.lineNumber, 0, 0, loc.jumpCode));
        editor.setDecorations(regular, x);
        editor.setDecorations(beginning, y);
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