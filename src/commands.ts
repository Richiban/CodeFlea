import * as vscode from "vscode";
import { Config } from "./config";
import * as editor from "./utils/editor";
import { FleaJumper } from "./jump/fleajump";
import type CodeFleaManager from "./CodeFleaManager";
import { collapseSelections } from "./utils/selectionsAndRanges";

export abstract class ExtensionCommand {
    abstract id: string;
    description?: string;
    defaultKeyBinding?: {
        key: string;
        when?: string;
    };

    constructor(protected readonly container: Container) {}

    abstract execute(...args: any[]): void | Promise<void>;
}

export type Container = {
    manager: CodeFleaManager;
    fleaJumper: FleaJumper;
    config: Config;
};

export const registeredCommands: ExtensionConstructor[] = [];

export function registerCommand() {
    return function <T extends ExtensionConstructor>(constructor: T) {
        registeredCommands.push(constructor);
        return constructor;
    };
}

type ExtensionConstructor = {
    new (container: Container): ExtensionCommand;
};

@registerCommand()
class SwapSubjectUp extends ExtensionCommand {
    id = "codeFlea.swapSubjectUp";

    async execute() {
        await this.container.manager.executeSubjectCommand("swapSubjectUp");
    }
}

@registerCommand()
class SwapSubjectDown extends ExtensionCommand {
    id = "codeFlea.swapSubjectDown";

    async execute() {
        await this.container.manager.executeSubjectCommand("swapSubjectDown");
    }
}

@registerCommand()
class SwapSubjectLeft extends ExtensionCommand {
    id = "codeFlea.swapSubjectLeft";

    async execute() {
        await this.container.manager.executeSubjectCommand("swapSubjectLeft");
    }
}

@registerCommand()
class SwapSubjectRight extends ExtensionCommand {
    id = "codeFlea.swapSubjectRight";

    async execute() {
        await this.container.manager.executeSubjectCommand("swapSubjectRight");
    }
}

@registerCommand()
class AddSubjectUp extends ExtensionCommand {
    id = "codeFlea.addSubjectUp";

    async execute() {
        await this.container.manager.executeSubjectCommand("addSubjectUp");
    }
}

@registerCommand()
class AddSubjectDown extends ExtensionCommand {
    id = "codeFlea.addSubjectDown";

    async execute() {
        await this.container.manager.executeSubjectCommand("addSubjectDown");
    }
}

@registerCommand()
class AddSubjectLeft extends ExtensionCommand {
    id = "codeFlea.addSubjectLeft";

    async execute() {
        await this.container.manager.executeSubjectCommand("addSubjectLeft");
    }
}

@registerCommand()
class AddSubjectRight extends ExtensionCommand {
    id = "codeFlea.addSubjectRight";

    async execute() {
        await this.container.manager.executeSubjectCommand("addSubjectRight");
    }
}

@registerCommand()
class NextSubjectRightCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectRight";

    async execute() {
        await this.container.manager.executeSubjectCommand("nextSubjectRight");
    }
}

@registerCommand()
class NextSubjectLeftCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectLeft";

    async execute() {
        await this.container.manager.executeSubjectCommand("nextSubjectLeft");
    }
}

@registerCommand()
class NextSubjectUpCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectUp";

    async execute() {
        await this.container.manager.executeSubjectCommand("nextSubjectUp");
    }
}

@registerCommand()
class NextSubjectDownCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectDown";

    async execute() {
        await this.container.manager.executeSubjectCommand("nextSubjectDown");
    }
}

@registerCommand()
class DeleteCommand extends ExtensionCommand {
    id = "codeFlea.deleteSubject";

    async execute() {
        await this.container.manager.executeSubjectCommand("deleteSubject");
    }
}

@registerCommand()
class DuplicateCommand extends ExtensionCommand {
    id = "codeFlea.duplicateSubject";

    async execute() {
        await this.container.manager.executeSubjectCommand("duplicateSubject");
    }
}

@registerCommand()
class ChangeNumHandlerCommand extends ExtensionCommand {
    id = "codeFlea.changeNumHandler";

    async execute() {
        await this.container.manager.changeNumHandler();
    }
}

@registerCommand()
class WordSubjectCommand extends ExtensionCommand {
    id = "codeFlea.changeToWordSubject";

    execute(): void {
        this.container.manager.changeMode({
            kind: "NAVIGATE",
            subjectName: "WORD",
        });
    }
}

@registerCommand()
class LineSubjectCommand extends ExtensionCommand {
    id = "codeFlea.changeToLineSubject";

    execute(): void {
        this.container.manager.changeMode({
            kind: "NAVIGATE",
            subjectName: "LINE",
        });
    }
}

@registerCommand()
class InterwordSubjectCommand extends ExtensionCommand {
    id = "codeFlea.changeToInterwordSubject";

    execute(): void {
        this.container.manager.changeMode({
            kind: "NAVIGATE",
            subjectName: "INTERWORD",
        });
    }
}

@registerCommand()
class SubwordSubjectCommand extends ExtensionCommand {
    id = "codeFlea.changeToSubwordSubject";

    execute(): void {
        this.container.manager.changeMode({
            kind: "NAVIGATE",
            subjectName: "SUBWORD",
        });
    }
}

@registerCommand()
class BlockSubjectCommand extends ExtensionCommand {
    id = "codeFlea.changeToBlockSubject";

    execute(): void {
        this.container.manager.changeMode({
            kind: "NAVIGATE",
            subjectName: "BLOCK",
        });
    }
}

@registerCommand()
class EditModeCommand extends ExtensionCommand {
    id = "codeFlea.changeToEditMode";

    execute() {
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class NavigateModeCommand extends ExtensionCommand {
    id = "codeFlea.changeToNavigationMode";

    execute(): void {
        this.container.manager.changeMode({
            kind: "NAVIGATE",
            subjectName: "WORD",
        });
    }
}

@registerCommand()
class ExtendModeCommand extends ExtensionCommand {
    id = "codeFlea.changeToExtendMode";

    execute(): void {
        this.container.manager.changeMode({
            kind: "EXTEND",
            subjectName: "WORD",
        });
    }
}

@registerCommand()
class JumpCommand extends ExtensionCommand {
    id = "codeFlea.jump";

    execute() {
        this.container.fleaJumper.jump();
    }
}

@registerCommand()
class ScrollToCursorCommand extends ExtensionCommand {
    id = "codeFlea.scrollToCursor";

    execute() {
        editor.scrollToCursorAtCenter(this.container.manager.editor);
    }
}

@registerCommand()
class AppendCommand extends ExtensionCommand {
    id = "codeFlea.changeToEditModeAppend";

    async execute() {
        collapseSelections(this.container.manager.editor, "end");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class EditMidPointCommand extends ExtensionCommand {
    id = "codeFlea.changeToEditModeMidPoint";

    async execute() {
        collapseSelections(this.container.manager.editor, "midpoint");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class PrependCommand extends ExtensionCommand {
    id = "codeFlea.changeToEditModePrepend";

    async execute() {
        collapseSelections(this.container.manager.editor, "start");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class RepeatCommand extends ExtensionCommand {
    id = "codeFlea.repeatCommand";

    async execute() {
        await this.container.manager.repeatSubjectCommand();
    }
}

@registerCommand()
class SearchCommand extends ExtensionCommand {
    id = "codeFlea.search";

    async execute() {
        await this.container.manager.executeSubjectCommand("search");
    }
}

@registerCommand()
class SearchBackWardsCommand extends ExtensionCommand {
    id = "codeFlea.searchBackwards";

    async execute() {
        await this.container.manager.executeSubjectCommand("searchBackwards");
    }
}

@registerCommand()
class OpenSpaceMenuCommand extends ExtensionCommand {
    id = "codeFlea.openSpaceMenu";

    async execute() {
        await this.container.manager.openSpaceMenu();
    }
}

@registerCommand()
class OpenGoToMenuCommand extends ExtensionCommand {
    id = "codeFlea.openGoToMenu";

    async execute() {
        await this.container.manager.openGoToMenu();
    }
}

@registerCommand()
class FirstInScopeCommand extends ExtensionCommand {
    id = "codeFlea.goToFirstSubjectInScope";

    async execute() {
        await this.container.manager.executeSubjectCommand(
            "firstSubjectInScope"
        );
    }
}

@registerCommand()
class LastInScopeCommand extends ExtensionCommand {
    id = "codeFlea.goToLastSubjectInScope";

    async execute() {
        await this.container.manager.executeSubjectCommand(
            "lastSubjectInScope"
        );
    }
}

@registerCommand()
class CustomVsCodeCommand extends ExtensionCommand {
    id = "codeFlea.customVsCodeCommand";

    async execute() {
        await this.container.manager.customVsCodeCommand();
    }
}

@registerCommand()
class ChangeCommand extends ExtensionCommand {
    id = "codeFlea.change";

    async execute() {
        await this.container.manager.changeMode({ kind: "EDIT" });
        await vscode.commands.executeCommand("deleteLeft");
    }
}

@registerCommand()
class ScrollEditorUpCommand extends ExtensionCommand {
    id = "codeFlea.scrollEditorUp";

    execute() {
        editor.scrollEditor("up", this.container.config.scrollStep);
    }
}

@registerCommand()
class ScrollEditorDownCommand extends ExtensionCommand {
    id = "codeFlea.scrollEditorDown";

    execute() {
        editor.scrollEditor("down", this.container.config.scrollStep);
    }
}

@registerCommand()
class NewLineBelow extends ExtensionCommand {
    id = "codeFlea.newLineBelow";

    async execute() {
        collapseSelections(this.container.manager.editor, "end");
        this.container.manager.changeMode({ kind: "EDIT" });

        await vscode.commands.executeCommand("editor.action.insertLineAfter");
    }
}

@registerCommand()
class NewLineAbove extends ExtensionCommand {
    id = "codeFlea.newLineAbove";

    async execute() {
        collapseSelections(this.container.manager.editor, "start");
        this.container.manager.changeMode({ kind: "EDIT" });
        await vscode.commands.executeCommand("editor.action.insertLineBefore");
    }
}

@registerCommand()
class TypeCommand extends ExtensionCommand {
    id = "type";

    execute(typed: { text: string }) {
        this.container.manager.onCharTyped(typed);
    }
}

@registerCommand()
class GoToPrevOccurrenceCommand extends ExtensionCommand {
    id = "codeFlea.goToPrevOccurrence";

    execute() {
        this.container.manager.executeSubjectCommand("prevSubjectMatch");
    }
}

@registerCommand()
class GoToNextOccurrenceCommand extends ExtensionCommand {
    id = "codeFlea.goToNextOccurrence";

    execute() {
        this.container.manager.executeSubjectCommand("nextSubjectMatch");
    }
}

@registerCommand()
class ExtendToPrevOccurrenceCommand extends ExtensionCommand {
    id = "codeFlea.extendToPrevOccurrence";

    execute() {
        this.container.manager.executeSubjectCommand("extendPrevSubjectMatch");
    }
}

@registerCommand()
class ExtendToNextOccurrenceCommand extends ExtensionCommand {
    id = "codeFlea.extendToNextOccurrence";

    execute() {
        this.container.manager.executeSubjectCommand("extendNextSubjectMatch");
    }
}

@registerCommand()
class OpenModifyMenuCommand extends ExtensionCommand {
    id = "codeFlea.openModifyMenu";

    async execute() {
        await this.container.manager.openModifyMenu();
    }
}

@registerCommand()
class UndoLastCommand extends ExtensionCommand {
    id = "codeFlea.undoCursorCommand";

    async execute() {
        await this.container.manager.undoLastCommand();
    }
}

@registerCommand()
class UndoCommand extends ExtensionCommand {
    id = "codeFlea.undoCommand";

    async execute() {
        await this.container.manager.undo();
    }
}

@registerCommand()
class NextOccurrenceOfCharCommand extends ExtensionCommand {
    id = "codeFlea.nextOccurrenceOfChar";

    async execute() {
        //await this.container.manager.nextOccurrenceOfChar();
    }
}

@registerCommand()
class PrevOccurrenceOfCharCommand extends ExtensionCommand {
    id = "codeFlea.prevOccurrenceOfChar";

    async execute() {
        //await this.container.manager.prevOccurrenceOfChar();
    }
}
