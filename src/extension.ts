import * as vscode from "vscode";
import { FleaJumper } from "./jump/fleajump";
import { loadConfig } from "./config";
import { scrollEditor } from "./editor";
import {
    ExtensionCommand,
    registerCommand,
    registeredCommands,
} from "./commands";
import { ModeManager } from "./modes";

export function activate(context: vscode.ExtensionContext) {
    const config = loadConfig();
    const fleaJumper = new FleaJumper(context, config);

    vscode.workspace.onDidChangeConfiguration((_) => {
        fleaJumper.updateConfig(loadConfig());
    });

    @registerCommand()
    class ScrollEditorUpCommand {
        id = "codeFlea.scrollEditorUp";

        execute() {
            scrollEditor("up", config.scrollStep);
        }
    }

    @registerCommand()
    class ScrollEditorDownCommand {
        id = "codeFlea.scrollEditorDown";

        execute() {
            scrollEditor("down", config.scrollStep);
        }
    }

    @registerCommand()
    class JumpCommand {
        id = "codeFlea.jump";

        execute() {
            fleaJumper.jump();
        }
    }

    const modeManager = new ModeManager(vscode.window.activeTextEditor, config);

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        modeManager.setEditor(editor);
    });

    modeManager.changeMode("NAVIGATE");

    @registerCommand()
    class TypeCommand implements ExtensionCommand {
        id = "type";

        execute(typed: { text: string }) {
            modeManager.onCharTyped(typed);
        }
    }

    @registerCommand()
    class EditModeCommand implements ExtensionCommand {
        id = "codeFlea.changeToEditMode";

        execute() {
            modeManager.changeMode("EDIT");
        }
    }

    @registerCommand()
    class NavigateModeCommand implements ExtensionCommand {
        id = "codeFlea.changeToNavigationMode";

        execute(): void {
            modeManager.changeMode("NAVIGATE");
        }
    }

    @registerCommand()
    class WordSubjectCommand implements ExtensionCommand {
        id = "codeFlea.changeToWordSubject";

        execute(): void {
            modeManager.changeMode("NAVIGATE", "WORD");
        }
    }

    @registerCommand()
    class LineSubjectCommand implements ExtensionCommand {
        id = "codeFlea.changeToLineSubject";

        execute(): void {
            modeManager.changeMode("NAVIGATE", "LINE");
        }
    }

    @registerCommand()
    class BlockSubjectCommand implements ExtensionCommand {
        id = "codeFlea.changeToBlockSubject";

        execute(): void {
            modeManager.changeMode("NAVIGATE", "BLOCK");
        }
    }

    @registerCommand()
    class ExtendModeCommand implements ExtensionCommand {
        id = "codeFlea.changeToExtendMode";

        execute(): void {
            modeManager.changeMode("EXTEND");
        }
    }

    for (const constructor of registeredCommands) {
        const command = new constructor();

        context.subscriptions.push(
            vscode.commands.registerCommand(command.id, (...args) =>
                command.execute(...args)
            )
        );
    }
}

export function deactivate() {}
