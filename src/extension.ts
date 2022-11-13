import * as vscode from "vscode";
import { Container, registeredCommands } from "./commands";
import { loadConfig } from "./config";
import { FleaJumper } from "./jump/fleajump";
import ModeManager from "./modes/ModeManager";

export function activate(context: vscode.ExtensionContext) {
    const config = loadConfig();
    const fleaJumper = new FleaJumper(config);
    const modeManager = new ModeManager(
        config,
        vscode.window.activeTextEditor!
    );

    const container: Container = {
        manager: modeManager,
        fleaJumper,
        config,
    };

    vscode.workspace.onDidChangeConfiguration((_) => {
        fleaJumper.updateConfig(loadConfig());
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        modeManager.changeEditor(editor);
    });

    vscode.window.onDidChangeTextEditorSelection((e) => {
        if (e.kind === vscode.TextEditorSelectionChangeKind.Command) {
            return;
        }

        modeManager.fixSelection();
    });

    modeManager.changeMode({ kind: "NAVIGATE", subjectName: "WORD" });

    for (const constructor of registeredCommands) {
        const command = new constructor(container);

        context.subscriptions.push(
            vscode.commands.registerCommand(command.id, (...args) =>
                command.execute(...args)
            )
        );
    }
}
