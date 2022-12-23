import * as vscode from "vscode";
import * as editor from "./utils/editor";
import type CodeFleaManager from "./CodeFleaManager";
import { collapseSelections } from "./utils/selectionsAndRanges";

type ExtensionCommand = {
    id: string;
    execute: (manager: CodeFleaManager, ...args: any[]) => Promise<void>;
};

export const registeredCommands: ExtensionCommand[] = [
    {
        id: "codeFlea.swapSubjectUp",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapWithObjectAbove");
        },
    },
    {
        id: "codeFlea.swapSubjectDown",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapWithObjectBelow");
        },
    },
    {
        id: "codeFlea.swapSubjectLeft",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapWithObjectToLeft");
        },
    },
    {
        id: "codeFlea.swapSubjectRight",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapWithObjectToRight");
        },
    },
    {
        id: "codeFlea.addSubjectUp",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addObjectAbove");
        },
    },
    {
        id: "codeFlea.addSubjectDown",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addObjectBelow");
        },
    },
    {
        id: "codeFlea.addSubjectLeft",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addObjectToLeft");
        },
    },
    {
        id: "codeFlea.addSubjectRight",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addObjectToRight");
        },
    },
    {
        id: "codeFlea.nextSubjectRight",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextObjectRight");
        },
    },
    {
        id: "codeFlea.nextSubjectLeft",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextObjectLeft");
        },
    },
    {
        id: "codeFlea.nextSubjectUp",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextObjectUp");
        },
    },
    {
        id: "codeFlea.nextSubjectDown",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextObjectDown");
        },
    },
    {
        id: "codeFlea.deleteSubject",
        execute: async (manager) => {
            await manager.executeSubjectCommand("deleteObject");
        },
    },
    {
        id: "codeFlea.duplicateSubject",
        execute: async (manager) => {
            await manager.executeSubjectCommand("duplicateObject");
        },
    },
    {
        id: "codeFlea.changeNumHandler",
        execute: async (manager) => {
            await manager.changeNumHandler();
        },
    },
    {
        id: "codeFlea.changeToPreviousSubject",
        execute: async (manager) => {},
    },
    {
        id: "codeFlea.changeToBracketSubject",
        execute: async (manager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "BRACKETS",
            });
        },
    },
    {
        id: "codeFlea.changeToWordSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "WORD",
            });
        },
    },
    {
        id: "codeFlea.changeToLineSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "LINE",
            });
        },
    },
    {
        id: "codeFlea.changeToInterwordSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "INTERWORD",
            });
        },
    },
    {
        id: "codeFlea.changeToSubwordSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "SUBWORD",
            });
        },
    },
    {
        id: "codeFlea.changeToBlockSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "BLOCK",
            });
        },
    },
    {
        id: "codeFlea.changeToInsertMode",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({ kind: "INSERT" });
        },
    },
    {
        id: "codeFlea.changeToFleaModeDefault",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
                subjectName: "WORD",
            });
        },
    },
    {
        id: "codeFlea.changeToFleaModeLast",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "FLEA",
            });
        },
    },
    {
        id: "codeFlea.changeToExtendMode",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "EXTEND",
                subjectName: "WORD",
            });
        },
    },
    {
        id: "codeFlea.jump",
        execute: async (manager: CodeFleaManager) => {
            manager.jump();
        },
    },
    {
        id: "codeFlea.scrollToCursor",
        execute: async (manager: CodeFleaManager) => {
            editor.scrollToCursorAtCenter(manager.editor);
        },
    },
    {
        id: "codeFlea.changeToInsertModeAppend",
        execute: async (manager) => {
            collapseSelections(manager.editor, "end");
            manager.changeMode({ kind: "INSERT" });
        },
    },
    {
        id: "codeFlea.changeToInsertModeMidPoint",
        execute: async (manager) => {
            collapseSelections(manager.editor, "midpoint");
            manager.changeMode({ kind: "INSERT" });
        },
    },
    {
        id: "codeFlea.changeToInsertModeSurround",
        execute: async (manager) => {
            collapseSelections(manager.editor, "surround");
            manager.changeMode({ kind: "INSERT" });
        },
    },
    {
        id: "codeFlea.changeToInsertModePrepend",
        execute: async (manager) => {
            collapseSelections(manager.editor, "start");
            manager.changeMode({ kind: "INSERT" });
        },
    },
    {
        id: "codeFlea.repeatCommand",
        execute: async (manager) => {
            await manager.repeatSubjectCommand();
        },
    },
    {
        id: "codeFlea.search",
        execute: async (manager) => {
            await manager.executeSubjectCommand("search");
        },
    },
    {
        id: "codeFlea.searchBackwards",
        execute: async (manager) => {
            await manager.executeSubjectCommand("searchBackwards");
        },
    },
    {
        id: "codeFlea.openSpaceMenu",
        execute: async (manager) => {
            await manager.openSpaceMenu();
        },
    },
    {
        id: "codeFlea.openGoToMenu",
        execute: async (manager) => {
            await manager.openGoToMenu();
        },
    },
    {
        id: "codeFlea.goToFirstSubjectInScope",
        execute: async (manager) => {
            await manager.executeSubjectCommand("firstObjectInScope");
        },
    },
    {
        id: "codeFlea.goToLastSubjectInScope",
        execute: async (manager) => {
            await manager.executeSubjectCommand("lastObjectInScope");
        },
    },
    {
        id: "codeFlea.customVsCodeCommand",
        execute: async (manager) => {
            await manager.customVsCodeCommand();
        },
    },
    {
        id: "codeFlea.change",
        execute: async (manager) => {
            await manager.changeMode({ kind: "INSERT" });
            await vscode.commands.executeCommand("deleteLeft");
        },
    },
    {
        id: "codeFlea.scrollEditorUp",
        execute: async (manager: CodeFleaManager) => {
            editor.scrollEditor("up", manager.config.scrollStep);
        },
    },
    {
        id: "codeFlea.scrollEditorDown",
        execute: async (manager: CodeFleaManager) => {
            editor.scrollEditor("down", manager.config.scrollStep);
        },
    },
    {
        id: "codeFlea.newLineBelow",
        execute: async (manager) => {
            collapseSelections(manager.editor, "end");
            manager.changeMode({ kind: "INSERT" });
            await vscode.commands.executeCommand(
                "editor.action.insertLineAfter"
            );
        },
    },
    {
        id: "codeFlea.newLineAbove",
        execute: async (manager) => {
            collapseSelections(manager.editor, "start");
            manager.changeMode({ kind: "INSERT" });
            await vscode.commands.executeCommand(
                "editor.action.insertLineBefore"
            );
        },
    },
    {
        id: "codeFlea.goToPrevOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("prevOccurrenceOfObject");
        },
    },
    {
        id: "codeFlea.goToNextOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("nextOccurrenceOfObject");
        },
    },
    {
        id: "codeFlea.extendToPrevOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("extendPrevOccurrenceOfObject");
        },
    },
    {
        id: "codeFlea.extendToNextOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("extendNextOccurrenceOfObject");
        },
    },
    {
        id: "codeFlea.openModifyMenu",
        execute: async (manager) => {
            await manager.openModifyMenu();
        },
    },
    {
        id: "codeFlea.undoCursorCommand",
        execute: async (manager) => {
            await manager.undoLastCommand();
        },
    },
    {
        id: "codeFlea.undoCommand",
        execute: async (manager) => {
            await manager.undo();
        },
    },
];
