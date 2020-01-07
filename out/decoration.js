"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Decorator {
    constructor(config, cache, decorations = {}, charDecorationType) {
        this.config = config;
        this.cache = cache;
        this.decorations = decorations;
        this.charDecorationType = charDecorationType;
        this.initialize = (config) => {
            this.config = config;
            this.updateCache();
            this.charDecorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: "rgba(0,255,0,0.3)",
                borderWidth: "2px",
                borderStyle: "solid",
                light: {
                    // this color will be used in light color themes
                    borderColor: "rgba(0,255,0,0.3)"
                },
                dark: {
                    // this color will be used in dark color themes
                    borderColor: "rgba(0,255,0,0.3)"
                }
            });
        };
        this.addCommandIndicator = (editor) => {
            let line = editor.selection.anchor.line;
            let char = editor.selection.anchor.character;
            let option = [new vscode.Range(line, char, line, char)];
            editor.setDecorations(this.charDecorationType, option);
        };
        this.removeCommandIndicator = (editor) => {
            var _a;
            let locations = [];
            (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.setDecorations(this.charDecorationType, locations);
        };
        this.addDecorations = (editor, decorationModel) => {
            let decorationType = this.createTextEditorDecorationType(1);
            let decorationType2 = this.createTextEditorDecorationType(2);
            let options = [];
            let options2 = [];
            decorationModel.forEach(model => {
                let code = model.code;
                let len = code.length;
                let option;
                if (len === 1) {
                    option = this.createDecorationOptions(null, model.line, model.character + 1, model.character + 1, code);
                    options.push(option);
                }
                else {
                    option = this.createDecorationOptions(null, model.line, model.character + 1, model.character + len, code);
                    options2.push(option);
                }
            });
            editor.setDecorations(decorationType, options);
            editor.setDecorations(decorationType2, options2);
        };
        this.removeDecorations = (editor) => {
            for (var dec in this.decorations) {
                if (this.decorations[dec] === null)
                    continue;
                editor.setDecorations(this.decorations[dec], []);
                this.decorations[dec].dispose();
                this.decorations[dec] = null;
            }
        };
        this.createTextEditorDecorationType = (charsToOffset) => {
            let decorationType = this.decorations[charsToOffset];
            if (decorationType)
                return decorationType;
            decorationType = vscode.window.createTextEditorDecorationType({
                after: {
                    margin: `0 0 0 ${charsToOffset * -this.config.decoration.width}px`,
                    height: `${this.config.decoration.height}px`,
                    width: `${charsToOffset * this.config.decoration.width}px`
                }
            });
            this.decorations[charsToOffset] = decorationType;
            return decorationType;
        };
        this.createDecorationOptions = (context, line, startCharacter, endCharacter, code) => {
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
}
exports.Decorator = Decorator;
//# sourceMappingURL=decoration.js.map