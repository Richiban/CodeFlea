import {
    moveToChangeOfIndentation,
    moveToNextLineSameLevel,
    moveCursorToNextBlankLine,
} from "./lines";
import { nextInterestingPoint } from "./points";
import {
    extendBlockSelection,
    moveToNextBlockStart,
    nextBlockEnd,
    selectAllBlocksInCurrentScope,
} from "./blocks";

export const registeredCommands: Map<string, DefaultConstructor> = new Map();

export function registerCommand(name: string) {
    return function <T extends DefaultConstructor>(constructor: T) {
        registeredCommands.set(name, constructor);
        return constructor;
    };
}

type DefaultConstructor = {
    new (...args: any[]): {
        execute: Function;
    };
};
