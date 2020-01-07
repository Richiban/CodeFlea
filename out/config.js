"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Config {
    constructor() {
        this.decoration = new DecoratorConfig();
        this.jumper = new FinderConfig();
        this.loadConfig = () => {
            try {
                let config = vscode.workspace.getConfiguration("codeFlea");
                this.decoration.bgColor = config.get("decoration.backgroundColor", this.decoration.bgColor);
                this.decoration.bgOpacity = config.get("decoration.backgroundOpacity", this.decoration.bgOpacity);
                this.decoration.color = config.get("decoration.color", this.decoration.color);
                this.decoration.borderColor = config.get("decoration.borderColor", this.decoration.borderColor);
                this.decoration.width = config.get("decoration.width", this.decoration.width);
                this.decoration.height = config.get("decoration.height", this.decoration.height);
                this.decoration.x = config.get("decoration.x", this.decoration.x);
                this.decoration.y = config.get("decoration.y", this.decoration.y);
                this.decoration.fontSize = config.get("decoration.fontSize", this.decoration.fontSize);
                this.decoration.fontWeight = config.get("decoration.fontWeight", this.decoration.fontWeight);
                this.decoration.fontFamily = config.get("decoration.fontFamily", this.decoration.fontFamily);
                this.decoration.upperCase = config.get("decoration.upperCase", this.decoration.upperCase);
                this.jumper.characters = config
                    .get("decoration.characters", "k, j, d, f, l, s, a, h, g, i, o, n, u, r, v, c, w, e, x, m, b, p, q, t, y, z")
                    .split(/[\s,]+/);
                this.jumper.findAllMode = config.get("jumper.findAllMode", this.jumper.findAllMode);
                this.jumper.findInSelection = config.get("jumper.findInSelection", this.jumper.findInSelection);
                this.jumper.wordSeparatorPattern = config.get("jumper.wordSeparatorPattern", this.jumper.wordSeparatorPattern);
                this.jumper.range = config.get("jumper.screenLineRange", this.jumper.range);
                this.jumper.targetIgnoreCase = config.get("jumper.targetIgnoreCase", this.jumper.targetIgnoreCase);
                let timeout = config.get("jumper.timeout", this.jumper.timeout);
                this.jumper.timeout = isNaN(timeout) ? 12000 : timeout * 1000;
            }
            catch (e) {
                vscode.window.showErrorMessage("CodeFlea: please double check your CodeFlea config->" + e);
            }
        };
    }
}
exports.Config = Config;
class DecoratorConfig {
    constructor() {
        this.bgOpacity = "0.88";
        this.bgColor = "lime,yellow";
        this.color = "black";
        this.borderColor = "black";
        this.width = 12;
        this.height = 14;
        this.x = 2;
        this.y = 12;
        this.fontSize = 14;
        this.fontWeight = "normal";
        this.fontFamily = "Consolas";
        this.upperCase = false;
    }
}
class FinderConfig {
    constructor() {
        this.characters = [
            "k",
            "j",
            "d",
            "f",
            "l",
            "s",
            "a",
            "h",
            "g",
            "i",
            "o",
            "n",
            "u",
            "r",
            "v",
            "c",
            "w",
            "e",
            "x",
            "m",
            "b",
            "p",
            "q",
            "t",
            "y",
            "z"
        ];
        this.findAllMode = "on";
        this.findInSelection = "off";
        this.wordSeparatorPattern = "[ ,-.{_(\"'<\\/[+]";
        this.range = 50;
        this.targetIgnoreCase = true;
        this.timeout = 12000;
    }
}
//# sourceMappingURL=config.js.map