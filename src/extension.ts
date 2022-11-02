// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FleaJumper } from "./fleajump";
import {
    moveToChangeOfIndentation,
    moveToNextLineSameLevel,
    moveCursorToNextBlankLine,
} from "./lines";
import { nextInterestingPoint } from "./points";
import { loadConfig } from "./config";
import { EditorManager, scrollEditor, scrollToCursorAtCenter } from "./editor";
import {
    extendBlockSelection,
    moveToNextBlockStart,
    nextBlockEnd,
    selectAllBlocksInCurrentScope,
} from "./blocks";

const commands: Map<string, DefaultConstructor> = new Map();

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

    const editorManager = new EditorManager(vscode.window.activeTextEditor);

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        editorManager.setEditor(editor);
    });

    @registerCommand("type")
    class TypeCommand implements ExtensionCommand {
        execute(typed: { text: string }) {
            editorManager.onCharTyped(typed);
        }
    }

    for (const [name, constructor] of commands) {
        context.subscriptions.push(
            vscode.commands.registerCommand(name, (...args) =>
                new constructor().execute(...args)
            )
        );
    }
}

function registerCommand(name: string) {
    return function <T extends DefaultConstructor>(constructor: T) {
        commands.set(name, constructor);
        return constructor;
    };
}

type ExtensionCommand = {
    execute: Function;
};

type DefaultConstructor = {
    new (...args: any[]): ExtensionCommand;
};

@registerCommand("codeFlea.enterNavigationMode")
class NavigateModeCommand implements ExtensionCommand {
    execute(): void {
        console.log("Command triggered: enter navigation mode");
    }
}

@registerCommand("codeFlea.prevBlock")
class PrevBlockCommand {
    execute() {
        moveToNextBlockStart("backwards", "any-indentation");
    }
}

@registerCommand("codeFlea.nextBlock")
class NextBlockCommand {
    execute() {
        moveToNextBlockStart("forwards", "any-indentation");
    }
}

@registerCommand("codeFlea.extendBlockSelection")
class ExtendBlockSelectionCommand {
    execute() {
        extendBlockSelection("forwards", "same-indentation");
    }
}

@registerCommand("codeFlea.nextOuterBlock")
class NextOuterBlockCommand {
    execute() {
        moveToNextBlockStart("forwards", "less-indentation");
    }
}

@registerCommand("codeFlea.prevOuterBlock")
class PrevOuterBlockCommand {
    execute() {
        moveToNextBlockStart("backwards", "less-indentation");
    }
}

@registerCommand("codeFlea.nextSameBlock")
class NextSameBlockCommand {
    execute() {
        moveToNextBlockStart("forwards", "same-indentation");
    }
}

@registerCommand("codeFlea.prevSameBlock")
class PrevSameBlockCommand {
    execute() {
        moveToNextBlockStart("backwards", "same-indentation");
    }
}

@registerCommand("codeFlea.nextInnerBlock")
class NextInnerBlockCommand {
    execute() {
        moveToNextBlockStart("forwards", "more-indentation");
    }
}

@registerCommand("codeFlea.prevInnerBlock")
class PrevInnerBlockCommand {
    execute() {
        moveToNextBlockStart("backwards", "more-indentation");
    }
}

@registerCommand("codeFlea.extendBlockSelectionBackwards")
class ExtendBlockSelectionBackwardsCommand {
    execute() {
        extendBlockSelection("backwards", "same-indentation");
    }
}

@registerCommand("codeFlea.nextBlankLine")
class NextBlankLineCommand {
    execute() {
        moveCursorToNextBlankLine("forwards");
    }
}

@registerCommand("codeFlea.prevBlankLine")
class PrevBlankLineCommand {
    execute() {
        moveCursorToNextBlankLine("backwards");
    }
}

@registerCommand("codeFlea.nearestInnerLine")
class NearestInnerLineCommand {
    execute() {
        moveToChangeOfIndentation("greaterThan", "nearest");
    }
}

@registerCommand("codeFlea.nearestOuterLine")
class NearestOuterLineCommand {
    execute() {
        moveToChangeOfIndentation("lessThan", "nearest");
    }
}

@registerCommand("codeFlea.nextInnerLine")
class NextInnerLineCommand {
    execute() {
        moveToChangeOfIndentation("greaterThan", "forwards");
    }
}

@registerCommand("codeFlea.prevOuterLine")
class PrevOuterLineCommand {
    execute() {
        moveToChangeOfIndentation("lessThan", "backwards");
    }
}

@registerCommand("codeFlea.nextSameLine")
class NextSameLineCommand {
    execute() {
        moveToNextLineSameLevel("forwards");
    }
}

@registerCommand("codeFlea.prevSameLine")
class PrevSameLineCommand {
    execute() {
        moveToNextLineSameLevel("backwards");
    }
}

@registerCommand("codeFlea.prevInterestingPoint")
class PrevInterestingPointCommand {
    execute() {
        nextInterestingPoint("backwards");
    }
}

@registerCommand("codeFlea.nextInterestingPoint")
class NextInterestingPointCommand {
    execute() {
        nextInterestingPoint("forwards");
    }
}

@registerCommand("codeFlea.scrollToCursor")
class ScrollToCursorCommand {
    execute() {
        scrollToCursorAtCenter();
    }
}

@registerCommand("codeFlea.nextBlockEnd")
class NextBlockEndCommand {
    execute() {
        nextBlockEnd("forwards", "any-indentation");
    }
}

@registerCommand("codeFlea.prevBlockEnd")
class PrevBlockEndCommand {
    execute() {
        nextBlockEnd("backwards", "any-indentation");
    }
}

@registerCommand("codeFlea.selectAllBlocksInCurrentScope")
class SelectAllBlocksInCurrentScopeCommand {
    execute() {
        selectAllBlocksInCurrentScope();
    }
}

export function deactivate() {}
