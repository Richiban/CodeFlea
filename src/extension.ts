import * as vscode from "vscode";
import { Container, registeredCommands } from "./commands";
import { loadConfig } from "./config";
import { FleaJumper } from "./jump/fleajump";
import ModeManager from "./modes/ModeManager";

export function activate(context: vscode.ExtensionContext) {
    const config = loadConfig();
    const fleaJumper = new FleaJumper(config);
    const modeManager = new ModeManager(config);
    const editor = vscode.window.activeTextEditor;

    if (editor) {
        modeManager.changeEditor(editor);
    }

    const container: Container = {
        manager: modeManager,
        fleaJumper,
        config,
    };

    vscode.workspace.onDidChangeConfiguration((_) => {
        fleaJumper.updateConfig(loadConfig());
    });

    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        await modeManager.changeEditor(editor);
    });

    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.kind === vscode.TextEditorSelectionChangeKind.Command) {
            return;
        }

        modeManager.fixSelection();
    });

    for (const constructor of registeredCommands) {
        const command = new constructor(container);

        context.subscriptions.push(
            vscode.commands.registerCommand(command.id, (...args) =>
                command.execute(...args)
            )
        );
    }
}
