import * as blocks from "./blocks";
import { Config } from "./config";
import * as editor from "./editor";
import { FleaJumper } from "./jump/fleajump";
import * as lines from "./lines";
import type ModeManager from "./modes/ModeManager";
import * as points from "./points";

export abstract class ExtensionCommand {
    abstract id: string;
    description?: string;
    defaultKeyBinding?: {
        key: string;
        when?: string;
    };

    constructor(protected readonly container: Container) {}

    protected get editor() {
        return this.container.manager.editor;
    }

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
        this.container.manager.executeCommand("swapSubjectUp");
    }
}

@registerCommand()
class SwapSubjectDown extends ExtensionCommand {
    id = "codeFlea.swapSubjectDown";

    async execute() {
        this.container.manager.executeCommand("swapSubjectDown");
    }
}

@registerCommand()
class SwapSubjectLeft extends ExtensionCommand {
    id = "codeFlea.swapSubjectLeft";

    async execute() {
        this.container.manager.executeCommand("swapSubjectLeft");
    }
}

@registerCommand()
class SwapSubjectRight extends ExtensionCommand {
    id = "codeFlea.swapSubjectRight";

    async execute() {
        this.container.manager.executeCommand("swapSubjectRight");
    }
}

@registerCommand()
class ExtendSubjectUp extends ExtensionCommand {
    id = "codeFlea.extendSubjectUp";

    async execute() {
        this.container.manager.executeCommand("extendSubjectUp");
    }
}

@registerCommand()
class ExtendSubjectDown extends ExtensionCommand {
    id = "codeFlea.extendSubjectDown";

    async execute() {
        this.container.manager.executeCommand("extendSubjectDown");
    }
}

@registerCommand()
class ExtendSubjectLeft extends ExtensionCommand {
    id = "codeFlea.extendSubjectLeft";

    async execute() {
        this.container.manager.executeCommand("extendSubjectLeft");
    }
}

@registerCommand()
class ExtendSubjectRight extends ExtensionCommand {
    id = "codeFlea.extendSubjectRight";

    async execute() {
        this.container.manager.executeCommand("extendSubjectRight");
    }
}

@registerCommand()
class NextSubjectRightCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectRight";

    execute() {
        this.container.manager.executeCommand("nextSubjectRight");
    }
}

@registerCommand()
class NextSubjectLeftCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectLeft";

    execute() {
        this.container.manager.executeCommand("nextSubjectLeft");
    }
}

@registerCommand()
class NextSubjectUpCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectUp";

    execute() {
        this.container.manager.executeCommand("nextSubjectUp");
    }
}

@registerCommand()
class NextSubjectDownCommand extends ExtensionCommand {
    id = "codeFlea.nextSubjectDown";

    execute() {
        this.container.manager.executeCommand("nextSubjectDown");
    }
}

@registerCommand()
class DeleteCommand extends ExtensionCommand {
    id = "codeFlea.deleteSubject";

    execute() {
        this.container.manager.executeCommand("deleteSubject");
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
        blocks.nextBlockEnd("forwards", "any-indentation");
    }
}

@registerCommand()
class PrevBlockEndCommand extends ExtensionCommand {
    id = "codeFlea.prevBlockEnd";

    execute() {
        blocks.nextBlockEnd("backwards", "any-indentation");
    }
}

@registerCommand()
class SelectAllBlocksInCurrentScopeCommand extends ExtensionCommand {
    id = "codeFlea.selectAllBlocksInCurrentScope";

    execute() {
        blocks.selectAllBlocksInCurrentScope();
    }
}

@registerCommand()
class PrevBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevBlock";

    execute() {
        blocks.moveToNextBlockStart("backwards", "any-indentation");
    }
}

@registerCommand()
class NextBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextBlock";

    execute() {
        blocks.moveToNextBlockStart("forwards", "any-indentation");
    }
}

@registerCommand()
class ExtendBlockSelectionCommand extends ExtensionCommand {
    id = "codeFlea.extendBlockSelection";

    execute() {
        blocks.extendBlockSelection("forwards", "same-indentation");
    }
}

@registerCommand()
class NextOuterBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextOuterBlock";

    execute() {
        blocks.moveToNextBlockStart("forwards", "less-indentation");
    }
}

@registerCommand()
class PrevOuterBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevOuterBlock";

    execute() {
        blocks.moveToNextBlockStart("backwards", "less-indentation");
    }
}

@registerCommand()
class NextSameBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextSameBlock";

    execute() {
        blocks.moveToNextBlockStart("forwards", "same-indentation");
    }
}

@registerCommand()
class PrevSameBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevSameBlock";

    execute() {
        blocks.moveToNextBlockStart("backwards", "same-indentation");
    }
}

@registerCommand()
class NextInnerBlockCommand extends ExtensionCommand {
    id = "codeFlea.nextInnerBlock";

    execute() {
        blocks.moveToNextBlockStart("forwards", "more-indentation");
    }
}

@registerCommand()
class PrevInnerBlockCommand extends ExtensionCommand {
    id = "codeFlea.prevInnerBlock";

    execute() {
        blocks.moveToNextBlockStart("backwards", "more-indentation");
    }
}

@registerCommand()
class ExtendBlockSelectionBackwardsCommand extends ExtensionCommand {
    id = "codeFlea.extendBlockSelectionBackwards";

    execute() {
        blocks.extendBlockSelection("backwards", "same-indentation");
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
        editor.scrollToCursorAtCenter();
    }
}

@registerCommand()
class NearestInnerLineCommand extends ExtensionCommand {
    id = "codeFlea.nearestInnerLine";

    execute() {
        lines.moveToChangeOfIndentation("greaterThan", "nearest");
    }
}

@registerCommand()
class NearestOuterLineCommand extends ExtensionCommand {
    id = "codeFlea.nearestOuterLine";

    execute() {
        lines.moveToChangeOfIndentation("lessThan", "nearest");
    }
}

@registerCommand()
class NextInnerLineCommand extends ExtensionCommand {
    id = "codeFlea.nextInnerLine";

    execute() {
        lines.moveToChangeOfIndentation("greaterThan", "forwards");
    }
}

@registerCommand()
class PrevOuterLineCommand extends ExtensionCommand {
    id = "codeFlea.prevOuterLine";

    execute() {
        lines.moveToChangeOfIndentation("lessThan", "backwards");
    }
}

@registerCommand()
class NextSameLineCommand extends ExtensionCommand {
    id = "codeFlea.nextSameLine";

    execute() {
        lines.moveToNextLineSameLevel("forwards");
    }
}

@registerCommand()
class PrevSameLineCommand extends ExtensionCommand {
    id = "codeFlea.prevSameLine";

    execute() {
        lines.moveToNextLineSameLevel("backwards");
    }
}

@registerCommand()
class NextBlankLineCommand extends ExtensionCommand {
    id = "codeFlea.nextBlankLine";

    execute() {
        lines.moveCursorToNextBlankLine("forwards");
    }
}

@registerCommand()
class PrevBlankLineCommand extends ExtensionCommand {
    id = "codeFlea.prevBlankLine";

    execute() {
        lines.moveCursorToNextBlankLine("backwards");
    }
}

@registerCommand()
class PrevInterestingPointCommand extends ExtensionCommand {
    id = "codeFlea.prevInterestingPoint";

    execute() {
        points.nextInterestingPoint("backwards");
    }
}

@registerCommand()
class NextInterestingPointCommand extends ExtensionCommand {
    id = "codeFlea.nextInterestingPoint";

    execute() {
        points.nextInterestingPoint("forwards");
    }
}

@registerCommand()
class AppendCommand extends ExtensionCommand {
    id = "codeFlea.changeToEditModeAppend";

    async execute() {
        await this.container.manager.executeCommand("append");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}

@registerCommand()
class PrependCommand extends ExtensionCommand {
    id = "codeFlea.changeToEditModePrepend";

    async execute() {
        await this.container.manager.executeCommand("prepend");
        this.container.manager.changeMode({ kind: "EDIT" });
    }
}
