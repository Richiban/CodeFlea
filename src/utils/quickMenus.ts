import * as vscode from "vscode";
import { scrollToCursorAtCenter } from "./editor";

export type QuickCommand = {
    quickKey: string;
    label: string;
    execute: () => Promise<void>;
};

export const ModifyCommands: QuickCommand[] = [
    {
        quickKey: "k",
        label: "Transform to kebab case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToKebabcase"
            );
        },
    },
    {
        quickKey: "l",
        label: "Transform to lower case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToLowercase"
            );
        },
    },
    {
        quickKey: "s",
        label: "Transform to snake case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToSnakecase"
            );
        },
    },
    {
        quickKey: "t",
        label: "Transform to title case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToTitlecase"
            );
        },
    },
    {
        quickKey: "u",
        label: "Transform to upper case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToUppercase"
            );
        },
    },
];

export const GoToCommands: QuickCommand[] = [
    {
        quickKey: "u",
        label: "top of file",
        execute: async () => {
            await vscode.commands.executeCommand("cursorTop");
        },
    },
    {
        quickKey: "e",
        label: "bottom of file",
        execute: async () => {
            await vscode.commands.executeCommand("cursorBottom");
        },
    },
    {
        quickKey: "t",
        label: "go to type definition",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.goToTypeDefinition"
            );
        },
    },
    {
        quickKey: "i",
        label: "go to implementation",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.goToImplementation"
            );
        },
    },
    {
        quickKey: "r",
        label: "find references",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.goToReferences"
            );
        },
    },
    {
        quickKey: "p",
        label: "go to file",
        execute: async () => {
            await vscode.commands.executeCommand("workbench.action.quickOpen");
        },
    },
    {
        quickKey: "q",
        label: "go to last edit location",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.navigateToLastEditLocation"
            );
        },
    },
    {
        quickKey: "b",
        label: "go to bracket",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.jumpToBracket");
        },
    },
    {
        quickKey: "b",
        label: "go to bracket",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.jumpToBracket");
        },
    },
    {
        quickKey: "f",
        label: "go to next folding range",
        execute: async () => {
            await vscode.commands.executeCommand("editor.gotoNextFold");
        },
    },
    {
        quickKey: "F",
        label: "go to previous folding range",
        execute: async () => {
            await vscode.commands.executeCommand("editor.gotoPreviousFold");
        },
    },
    {
        quickKey: "a",
        label: "go to parent fold",
        execute: async () => {
            await vscode.commands.executeCommand("editor.gotoParentFold");
        },
    },
];

export const SpaceCommands: QuickCommand[] = [
    {
        quickKey: " ",
        label: "center editor",
        execute: async () => {
            if (vscode.window.activeTextEditor) {
                scrollToCursorAtCenter(vscode.window.activeTextEditor);
            }
        },
    },
    {
        quickKey: "b",
        label: "open breadcrumbs",
        execute: async () => {
            await vscode.commands.executeCommand("breadcrumbs.focusAndSelect");
        },
    },
    {
        quickKey: "f",
        label: "format document",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.formatDocument"
            );
        },
    },
    {
        quickKey: "r",
        label: "rename",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.rename");
        },
    },
    {
        quickKey: "s",
        label: "Open VS Codes's Go to Symbol in Editor",
        execute: async () => {
            await vscode.commands.executeCommand("workbench.action.gotoSymbol");
        },
    },
    {
        quickKey: "S",
        label: "Open VS Codes's Go to Symbol in Workspace",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.showAllSymbols"
            );
        },
    },
    {
        quickKey: "h",
        label: "Show Definition Preview Hover.",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.showHover");
        },
    },
    {
        quickKey: "l",
        label: "Toggle fold",
        execute: async () => {
            await vscode.commands.executeCommand("editor.toggleFold");
        },
    },
    {
        quickKey: "1",
        label: "Fold level 1",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel1");
        },
    },
    {
        quickKey: "2",
        label: "Fold level 2",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel2");
        },
    },
    {
        quickKey: "3",
        label: "Fold level 3",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel3");
        },
    },
    {
        quickKey: "4",
        label: "Fold level 4",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel4");
        },
    },
    {
        quickKey: "5",
        label: "Fold level 5",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel5");
        },
    },
    {
        quickKey: "6",
        label: "Fold level 6",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel6");
        },
    },
    {
        quickKey: "7",
        label: "Fold level 7",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel7");
        },
    },
];
