import * as vscode from "vscode";
import { FleaJumper } from "./jump/fleajump";
import { loadConfig } from "./config";
import { scrollEditor } from "./editor";
import * as commands from "./commands";
import ModeManager from "./modes/ModeManager";

export function activate(context: vscode.ExtensionContext) {
    const config = loadConfig();
    const fleaJumper = new FleaJumper(context, config);

    vscode.workspace.onDidChangeConfiguration((_) => {
        fleaJumper.updateConfig(loadConfig());
    });

    @commands.registerCommand()
    class ScrollEditorUpCommand {
        id = "codeFlea.scrollEditorUp";

        execute() {
            scrollEditor("up", config.scrollStep);
        }
    }

    @commands.registerCommand()
    class ScrollEditorDownCommand {
        id = "codeFlea.scrollEditorDown";

        execute() {
            scrollEditor("down", config.scrollStep);
        }
    }

    @commands.registerCommand()
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

    @commands.registerCommand()
    class TypeCommand implements commands.ExtensionCommand {
        id = "type";

        execute(typed: { text: string }) {
            modeManager.onCharTyped(typed);
        }
    }

    @commands.registerCommand()
    class EditModeCommand implements commands.ExtensionCommand {
        id = "codeFlea.changeToEditMode";

        execute() {
            modeManager.changeMode("EDIT");
        }
    }

    @commands.registerCommand()
    class NavigateModeCommand implements commands.ExtensionCommand {
        id = "codeFlea.changeToNavigationMode";

        execute(): void {
            modeManager.changeMode("NAVIGATE");
        }
    }

    @commands.registerCommand()
    class WordSubjectCommand implements commands.ExtensionCommand {
        id = "codeFlea.changeToWordSubject";

        execute(): void {
            modeManager.changeMode("NAVIGATE", "WORD");
        }
    }

    @commands.registerCommand()
    class LineSubjectCommand implements commands.ExtensionCommand {
        id = "codeFlea.changeToLineSubject";

        execute(): void {
            //modeManager.changeMode("NAVIGATE", "LINE");
        }
    }

    @commands.registerCommand()
    class BlockSubjectCommand implements commands.ExtensionCommand {
        id = "codeFlea.changeToBlockSubject";

        execute(): void {
            //modeManager.changeMode("NAVIGATE", "BLOCK");
        }
    }

    @commands.registerCommand()
    class ExtendModeCommand implements commands.ExtensionCommand {
        id = "codeFlea.changeToExtendMode";

        execute(): void {
            modeManager.changeMode("EXTEND");
        }
    }

    @commands.registerCommand()
    class NextSubjectRightCommand implements commands.ExtensionCommand {
        id = "codeFlea.nextSubjectRight";
        execute() {
            modeManager.executeCommand("nextSubjectRight");
        }
    }

    @commands.registerCommand()
    class NextSubjectLeftCommand implements commands.ExtensionCommand {
        id = "codeFlea.nextSubjectLeft";
        execute() {
            modeManager.executeCommand("nextSubjectLeft");
        }
    }

    @commands.registerCommand()
    class DeleteCommand implements commands.ExtensionCommand {
        id = "codeFlea.delete";
        execute() {
            modeManager.executeCommand("delete");
        }
    }

    @commands.registerCommand()
    class ChangeCommand implements commands.ExtensionCommand {
        id = "codeFlea.change";
        execute() {
            modeManager.executeCommand("delete");
            modeManager.changeMode("EDIT");
        }
    }

    for (const constructor of commands.registeredCommands) {
        const command = new constructor();

        context.subscriptions.push(
            vscode.commands.registerCommand(command.id, (...args) =>
                command.execute(...args)
            )
        );
    }
}

export function deactivate() {}
