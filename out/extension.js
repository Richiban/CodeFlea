"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const points_1 = require("./points");
const fleajump_1 = require("./fleajump");
const config_1 = require("./config");
const lines_1 = require("./lines");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.nextInterestingLine", () => lines_1.moveToNextInterestingLine("forwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.prevInterestingLine", () => lines_1.moveToNextInterestingLine("backwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.nearestLineOfGreaterIndentation", () => lines_1.moveToChangeOfIndentation("greaterThan", "nearest")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.nearestLineOfLesserIndentation", () => lines_1.moveToChangeOfIndentation("lessThan", "nearest")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.nextLineOfGreaterIndentation", () => lines_1.moveToChangeOfIndentation("greaterThan", "forwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.prevLineOfLesserIndentation", () => lines_1.moveToChangeOfIndentation("lessThan", "backwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.nextLineOfSameIndentation", () => lines_1.moveToLineOfSameIndentation("forwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.prevLineOfSameIndentation", () => lines_1.moveToLineOfSameIndentation("backwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.prevInterestingPoint", () => points_1.default.moveToInterestingPoint("backwards")));
    context.subscriptions.push(vscode.commands.registerCommand("codeFlea.nextInterestingPoint", () => points_1.default.moveToInterestingPoint("forwards")));
    let config = new config_1.Config();
    config.loadConfig();
    const fleaJumper = new fleajump_1.FleaJumper(context, config);
    vscode.workspace.onDidChangeConfiguration(_ => {
        config.loadConfig();
        fleaJumper.updateConfig();
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map