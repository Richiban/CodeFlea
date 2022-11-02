// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FleaJumper } from "./fleajump";
import { loadConfig } from "./config";
import { scrollEditor } from "./editor";
import { registerCommand, registeredCommands } from "./commands";
import { ModeManager } from "./editorManager";

export function activate(context: vscode.ExtensionContext) {
    const config = loadConfig();
    const fleaJumper = new FleaJumper(context, config);

    vscode.workspace.onDidChangeConfiguration((_) => {
        fleaJumper.updateConfig(loadConfig());
    });

    @registerCommand("codeFlea.scrollEditorUp")
    class ScrollEditorUpCommand {
        execute() {
            scrollEditor("up", config.scrollStep);
        }
    }

    @registerCommand("codeFlea.scrollEditorDown")
    class ScrollEditorDownCommand {
        execute() {
            scrollEditor("down", config.scrollStep);
        }
    }

    @registerCommand("codeFlea.jump")
    class JumpCommand {
        execute() {
            fleaJumper.jump();
        }
    }

    const modeManager = new ModeManager(vscode.window.activeTextEditor, config);

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        modeManager.setEditor(editor);
    });

    modeManager.changeMode("NAVIGATE");

    @registerCommand("type")
    class TypeCommand {
        execute(typed: { text: string }) {
            modeManager.onCharTyped(typed);
        }
    }

    @registerCommand("codeFlea.changeToEditMode")
    class EditModeCommand {
        execute() {
            modeManager.changeMode("EDIT");
        }
    }

    @registerCommand("codeFlea.changeToNavigationMode")
    class NavigateModeCommand {
        execute(): void {
            modeManager.changeMode("NAVIGATE");
        }
    }

    @registerCommand("codeFlea.changeToWordSubject")
    class WordSubjectCommand {
        execute(): void {
            modeManager.changeMode("NAVIGATE", "WORD");
        }
    }

    @registerCommand("codeFlea.changeToLineSubject")
    class LineSubjectCommand {
        execute(): void {
            modeManager.changeMode("NAVIGATE", "LINE");
        }
    }

    @registerCommand("codeFlea.changeToBlockSubject")
    class BlockSubjectCommand {
        execute(): void {
            modeManager.changeMode("NAVIGATE", "BLOCK");
        }
    }

    @registerCommand("codeFlea.changeToExtendMode")
    class ExtendModeCommand {
        execute(): void {
            modeManager.changeMode("EXTEND");
        }
    }

    for (const [name, constructor] of registeredCommands) {
        context.subscriptions.push(
            vscode.commands.registerCommand(name, (...args) =>
                new constructor().execute(...args)
            )
        );
    }
}

export function deactivate() {}
