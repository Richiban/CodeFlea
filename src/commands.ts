import * as vscode from "vscode";
import * as editor from "./utils/editor";
import type CodeFleaManager from "./CodeFleaManager";
import { collapseSelections } from "./utils/selectionsAndRanges";

export type ExtensionCommand = {
    id: string;
    execute: (manager: CodeFleaManager, ...args: any[]) => Promise<void>;
};

export const registeredCommands: ExtensionCommand[] = [
    {
        id: "codeFlea.swapSubjectUp",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapSubjectUp");
        },
    },
    {
        id: "codeFlea.swapSubjectDown",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapSubjectDown");
        },
    },
    {
        id: "codeFlea.swapSubjectLeft",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapSubjectLeft");
        },
    },
    {
        id: "codeFlea.swapSubjectRight",
        execute: async (manager) => {
            await manager.executeSubjectCommand("swapSubjectRight");
        },
    },
    {
        id: "codeFlea.addSubjectUp",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addSubjectUp");
        },
    },
    {
        id: "codeFlea.addSubjectDown",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addSubjectDown");
        },
    },
    {
        id: "codeFlea.addSubjectLeft",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addSubjectLeft");
        },
    },
    {
        id: "codeFlea.addSubjectRight",
        execute: async (manager) => {
            await manager.executeSubjectCommand("addSubjectRight");
        },
    },
    {
        id: "codeFlea.nextSubjectRight",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextSubjectRight");
        },
    },
    {
        id: "codeFlea.nextSubjectLeft",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextSubjectLeft");
        },
    },
    {
        id: "codeFlea.nextSubjectUp",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextSubjectUp");
        },
    },
    {
        id: "codeFlea.nextSubjectDown",
        execute: async (manager) => {
            await manager.executeSubjectCommand("nextSubjectDown");
        },
    },
    {
        id: "codeFlea.deleteSubject",
        execute: async (manager) => {
            await manager.executeSubjectCommand("deleteSubject");
        },
    },
    {
        id: "codeFlea.duplicateSubject",
        execute: async (manager) => {
            await manager.executeSubjectCommand("duplicateSubject");
        },
    },
    {
        id: "codeFlea.changeNumHandler",
        execute: async (manager) => {
            await manager.changeNumHandler();
        },
    },
    {
        id: "codeFlea.changeToWordSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "NAVIGATE",
                subjectName: "WORD",
            });
        },
    },
    {
        id: "codeFlea.changeToLineSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "NAVIGATE",
                subjectName: "LINE",
            });
        },
    },
    {
        id: "codeFlea.changeToInterwordSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "NAVIGATE",
                subjectName: "INTERWORD",
            });
        },
    },
    {
        id: "codeFlea.changeToSubwordSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "NAVIGATE",
                subjectName: "SUBWORD",
            });
        },
    },
    {
        id: "codeFlea.changeToBlockSubject",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "NAVIGATE",
                subjectName: "BLOCK",
            });
        },
    },
    {
        id: "codeFlea.changeToEditMode",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({ kind: "EDIT" });
        },
    },
    {
        id: "codeFlea.changeToNavigationMode",
        execute: async (manager: CodeFleaManager) => {
            manager.changeMode({
                kind: "NAVIGATE",
                subjectName: "WORD",
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
        id: "codeFlea.changeToEditModeAppend",
        execute: async (manager) => {
            collapseSelections(manager.editor, "end");
            manager.changeMode({ kind: "EDIT" });
        },
    },
    {
        id: "codeFlea.changeToEditModeMidPoint",
        execute: async (manager) => {
            collapseSelections(manager.editor, "midpoint");
            manager.changeMode({ kind: "EDIT" });
        },
    },
    {
        id: "codeFlea.changeToEditModeSurround",
        execute: async (manager) => {
            collapseSelections(manager.editor, "surround");
            manager.changeMode({ kind: "EDIT" });
        },
    },
    {
        id: "codeFlea.changeToEditModePrepend",
        execute: async (manager) => {
            collapseSelections(manager.editor, "start");
            manager.changeMode({ kind: "EDIT" });
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
            await manager.executeSubjectCommand("firstSubjectInScope");
        },
    },
    {
        id: "codeFlea.goToLastSubjectInScope",
        execute: async (manager) => {
            await manager.executeSubjectCommand("lastSubjectInScope");
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
            await manager.changeMode({ kind: "EDIT" });
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
            manager.changeMode({ kind: "EDIT" });
            await vscode.commands.executeCommand(
                "editor.action.insertLineAfter"
            );
        },
    },
    {
        id: "codeFlea.newLineAbove",
        execute: async (manager) => {
            collapseSelections(manager.editor, "start");
            manager.changeMode({ kind: "EDIT" });
            await vscode.commands.executeCommand(
                "editor.action.insertLineBefore"
            );
        },
    },
    {
        id: "type",
        execute: async (manager: CodeFleaManager, typed: { text: string }) => {
            manager.onCharTyped(typed);
        },
    },
    {
        id: "codeFlea.goToPrevOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("prevSubjectMatch");
        },
    },
    {
        id: "codeFlea.goToNextOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("nextSubjectMatch");
        },
    },
    {
        id: "codeFlea.extendToPrevOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("extendPrevSubjectMatch");
        },
    },
    {
        id: "codeFlea.extendToNextOccurrence",
        execute: async (manager: CodeFleaManager) => {
            manager.executeSubjectCommand("extendNextSubjectMatch");
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
