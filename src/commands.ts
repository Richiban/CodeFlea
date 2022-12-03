import * as vscode from "vscode";
import { Config } from "./config";
import * as editor from "./utils/editor";
import { FleaJumper } from "./jump/fleajump";
import type ModeManager from "./modes/ModeManager";
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
    manager: ModeManager;
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
class ExtendSubjectUp extends ExtensionCommand {
    id = "codeFlea.extendSubjectUp";

    async execute() {
        await this.container.manager.executeSubjectCommand("extendSubjectUp");
    }
}

@registerCommand()
class ExtendSubjectDown extends ExtensionCommand {
    id = "codeFlea.extendSubjectDown";

    async execute() {
        await this.container.manager.executeSubjectCommand("extendSubjectDown");
    }
}

@registerCommand()
class ExtendSubjectLeft extends ExtensionCommand {
    id = "codeFlea.extendSubjectLeft";

    async execute() {
        await this.container.manager.executeSubjectCommand("extendSubjectLeft");
    }
}

@registerCommand()
class ExtendSubjectRight extends ExtensionCommand {
    id = "codeFlea.extendSubjectRight";

    async execute() {
        await this.container.manager.executeSubjectCommand(
            "extendSubjectRight"
        );
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
class NextBlockEndCommand extends ExtensionCommand {
    id = "codeFlea.nextBlockEnd";

    execute() {
        // blocks.nextBlockEnd("forwards", "any-indentation");
    }
}

@registerCommand()
class PrevBlockEndCommand extends ExtensionCommand {
    id = "codeFlea.prevBlockEnd";

    execute() {
        // blocks.nextBlockEnd("backwards", "any-indentation");
    }
}

@registerCommand()
class SelectAllBlocksInCurrentScopeCommand extends ExtensionCommand {
    id = "codeFlea.selectAllBlocksInCurrentScope";

    execute() {
        //blocks.selectAllBlocksInCurrentScope();
    }
}

@registerCommand()
class PrevBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevBlock";

    execute() {
        //blocks.moveToNextBlockStart("backwards", "any-indentation");
    }
}

@registerCommand()
class NextBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextBlock";

    execute() {
        //blocks.moveToNextBlockStart("forwards", "any-indentation");
    }
}

@registerCommand()
class NextOuterBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextOuterBlock";

    execute() {
        //blocks.moveToNextBlockStart("forwards", "less-indentation");
    }
}

@registerCommand()
class PrevOuterBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevOuterBlock";

    execute() {
        // blocks.moveToNextBlockStart("backwards", "less-indentation");
    }
}

@registerCommand()
class NextSameBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextSameBlock";

    execute() {
        // blocks.moveToNextBlockStart("forwards", "same-indentation");
    }
}

@registerCommand()
class PrevSameBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevSameBlock";

    execute() {
        // blocks.moveToNextBlockStart("backwards", "same-indentation");
    }
}

@registerCommand()
class NextInnerBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextInnerBlock";

    execute() {
        // blocks.moveToNextBlockStart("forwards", "more-indentation");
    }
}

@registerCommand()
class PrevInnerBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevInnerBlock";

    execute() {
        // blocks.moveToNextBlockStart("backwards", "more-indentation");
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
class NearestInnerLineCommand extends ExtensionCommand {
    id = "codeFlea.nearestInnerLine";

    execute() {
        // lines.moveToChangeOfIndentation("greaterThan", "nearest");
    }
}

@registerCommand()
class NearestOuterLineCommand extends ExtensionCommand {
    id = "codeFlea.nearestOuterLine";

    execute() {
        // lines.moveToChangeOfIndentation("lessThan", "nearest");
    }
}

@registerCommand()
class NextInnerLineCommand extends ExtensionCommand {
    id = "codeFlea.nextInnerLine";

    execute() {
        // lines.moveToChangeOfIndentation("greaterThan", "forwards");
    }
}

@registerCommand()
class PrevOuterLineCommand extends ExtensionCommand {
    id = "codeFlea.prevOuterLine";

    execute() {
        // lines.moveToChangeOfIndentation("lessThan", "backwards");
    }
}

@registerCommand()
class NextSameLineCommand extends ExtensionCommand {
    id = "codeFlea.nextSameLine";

    execute() {
        // lines.moveToNextLineSameLevel("forwards");
    }
}

@registerCommand()
class PrevSameLineCommand extends ExtensionCommand {
    id = "codeFlea.prevSameLine";

    execute() {
        // lines.moveToNextLineSameLevel("backwards");
    }
}

@registerCommand()
class NextBlankLineCommand extends ExtensionCommand {
    id = "codeFlea.nextBlankLine";

    execute() {
        // lines.moveCursorToNextBlankLine("forwards");
    }
}

@registerCommand()
class PrevBlankLineCommand extends ExtensionCommand {
    id = "codeFlea.prevBlankLine";

    execute() {
        // lines.moveCursorToNextBlankLine("backwards");
    }
}

@registerCommand()
class PrevInterestingPointCommand extends ExtensionCommand {
    id = "codeFlea.prevInterestingPoint";

    execute() {
        //points.nextInterestingPoint("backwards");
    }
}

@registerCommand()
class NextInterestingPointCommand extends ExtensionCommand {
    id = "codeFlea.nextInterestingPoint";

    execute() {
        // points.nextInterestingPoint("forwards");
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
    id = "codeFlea.undoCommand";

    async execute() {
        await this.container.manager.undoLastCommand();
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
