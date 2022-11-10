import * as vscode from "vscode";
import {
    Container,
    ExtensionCommand,
    registerCommand,
    registeredCommands,
} from "./commands";
import { loadConfig } from "./config";
import { scrollEditor } from "./utils/editor";
import { FleaJumper } from "./jump/fleajump";
import ModeManager from "./modes/ModeManager";

export function activate(context: vscode.ExtensionContext) {
    const config = loadConfig();
    const fleaJumper = new FleaJumper(config);
    const modeManager = new ModeManager(vscode.window.activeTextEditor, config);

    const container: Container = {
        manager: modeManager,
        fleaJumper,
        config,
    };

    vscode.workspace.onDidChangeConfiguration((_) => {
        fleaJumper.updateConfig(loadConfig());
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        modeManager.setEditor(editor);
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

@registerCommand()
class ChangeCommand extends ExtensionCommand {
    id = "codeFlea.change";

    execute() {
        this.container.manager.executeSubjectCommand("changeSubject");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

export function deactivate() {}

@registerCommand()
class ScrollEditorUpCommand extends ExtensionCommand {
    id = "codeFlea.scrollEditorUp";

    execute() {
        scrollEditor("up", this.container.config.scrollStep);
    }
}

@registerCommand()
class ScrollEditorDownCommand extends ExtensionCommand {
    id = "codeFlea.scrollEditorDown";

    execute() {
        scrollEditor("down", this.container.config.scrollStep);
    }
}

@registerCommand()
class NewLineBelow extends ExtensionCommand {
    id = "codeFlea.newLineBelow";

    async execute() {
        await vscode.commands.executeCommand("editor.action.insertLineAfter");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class NewLineAbove extends ExtensionCommand {
    id = "codeFlea.newLineAbove";

    async execute() {
        await vscode.commands.executeCommand("editor.action.insertLineBefore");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class TypeCommand extends ExtensionCommand {
    id = "type";

    execute(typed: { text: string }) {
        this.container.manager.onCharTyped(typed);
    }
}
