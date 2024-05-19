import * as vscode from "vscode";
import { scrollToCursorAtCenter } from "./editor";
import * as common from "../common";

export function char(ch: string): common.Char {
    return ch as common.Char;
}

export type QuickCommand = {
    quickKey: common.Char;
    label: string;
    execute: () => Promise<void>;
};

export const ModifyCommands: QuickCommand[] = [
    {
        quickKey: char("k"),
        label: "Transform to kebab case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToKebabcase"
            );
        },
    },
    {
        quickKey: char("l"),
        label: "Transform to lower case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToLowercase"
            );
        },
    },
    {
        quickKey: char("s"),
        label: "Transform to snake case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToSnakecase"
            );
        },
    },
    {
        quickKey: char("c"),
        label: "Transform to camel case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToCamelcase"
            );
        },
    },
    {
        quickKey: char("t"),
        label: "Transform to title case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToTitlecase"
            );
        },
    },
    {
        quickKey: char("u"),
        label: "Transform to upper case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToUppercase"
            );
        },
    },
    {
        quickKey: char("p"),
        label: "Transform to Pascal case",
        async execute() {
            await vscode.commands.executeCommand(
                "editor.action.transformToPascalcase"
            );
        },
    },
    {
        quickKey: char("f"),
        label: "Flip case of first character",
        async execute() {
            await vscode.commands.executeCommand(
                "codeFlea.flipCaseFirstCharacter"
            );
        },
    },
];

export const GoToCommands: QuickCommand[] = [
    {
        quickKey: char("u"),
        label: "Top of file",
        execute: async () => {
            await vscode.commands.executeCommand("cursorTop");
        },
    },
    {
        quickKey: char("e"),
        label: "Bottom of file",
        execute: async () => {
            await vscode.commands.executeCommand("cursorBottom");
        },
    },
    {
        quickKey: char("t"),
        label: "Go to type definition",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.goToTypeDefinition"
            );
        },
    },
    {
        quickKey: char("i"),
        label: "Go to implementation",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.goToImplementation"
            );
        },
    },
    {
        quickKey: char("r"),
        label: "Find references",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.goToReferences"
            );
        },
    },
    {
        quickKey: char("p"),
        label: "Go to file",
        execute: async () => {
            await vscode.commands.executeCommand("workbench.action.quickOpen");
        },
    },
    {
        quickKey: char("q"),
        label: "Go to last edit location",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.navigateToLastEditLocation"
            );
        },
    },
    {
        quickKey: char("b"),
        label: "Go to bracket",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.jumpToBracket");
        },
    },
    {
        quickKey: char("b"),
        label: "Go to bracket",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.jumpToBracket");
        },
    },
    {
        quickKey: char("f"),
        label: "Go to next folding range",
        execute: async () => {
            await vscode.commands.executeCommand("editor.gotoNextFold");
        },
    },
    {
        quickKey: char("F"),
        label: "Go to previous folding range",
        execute: async () => {
            await vscode.commands.executeCommand("editor.gotoPreviousFold");
        },
    },
    {
        quickKey: char("a"),
        label: "Go to parent fold",
        execute: async () => {
            await vscode.commands.executeCommand("editor.gotoParentFold");
        },
    },
];

export const ViewCommands: QuickCommand[] = [
    {
        quickKey: char("1"),
        label: "Single column editor layout",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.editorLayoutSingle"
            );
        },
    },
    {
        quickKey: char("2"),
        label: "Two columns editor layout",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.editorLayoutTwoColumns"
            );
        },
    },
    {
        quickKey: char("3"),
        label: "Three columns editor layout",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.editorLayoutThreeColumns"
            );
        },
    },
    {
        quickKey: char("n"),
        label: "Focus previous editor group",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.focusPreviousGroup"
            );
        },
    },
    {
        quickKey: char("i"),
        label: "Focus next editor group",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.focusNextGroup"
            );
        },
    },
    {
        quickKey: char("e"),
        label: "Focus editor group below",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.focusBelowGroup"
            );
        },
    },
    {
        quickKey: char("u"),
        label: "Focus editor group above",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.focusAboveGroup"
            );
        },
    },
];

export const SpaceCommands: QuickCommand[] = [
    {
        quickKey: char(" "),
        label: "Center editor",
        execute: async () => {
            if (vscode.window.activeTextEditor) {
                scrollToCursorAtCenter(vscode.window.activeTextEditor);
            }
        },
    },
    {
        quickKey: char("b"),
        label: "Open breadcrumbs",
        execute: async () => {
            await vscode.commands.executeCommand("breadcrumbs.focusAndSelect");
        },
    },
    {
        quickKey: char("f"),
        label: "Format document",
        execute: async () => {
            await vscode.commands.executeCommand(
                "editor.action.formatDocument"
            );
        },
    },
    {
        quickKey: char("r"),
        label: "Rename",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.rename");
        },
    },
    {
        quickKey: char("s"),
        label: "Open VS Codes's Go to Symbol in Editor",
        execute: async () => {
            await vscode.commands.executeCommand("workbench.action.gotoSymbol");
        },
    },
    {
        quickKey: char("S"),
        label: "Open VS Codes's Go to Symbol in Workspace",
        execute: async () => {
            await vscode.commands.executeCommand(
                "workbench.action.showAllSymbols"
            );
        },
    },
    {
        quickKey: char("h"),
        label: "Show Definition Preview Hover",
        execute: async () => {
            await vscode.commands.executeCommand("editor.action.showHover");
        },
    },
    {
        quickKey: char("l"),
        label: "Toggle fold",
        execute: async () => {
            await vscode.commands.executeCommand("editor.toggleFold");
        },
    },
    {
        quickKey: char("1"),
        label: "Fold level 1",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel1");
        },
    },
    {
        quickKey: char("2"),
        label: "Fold level 2",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel2");
        },
    },
    {
        quickKey: char("3"),
        label: "Fold level 3",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel3");
        },
    },
    {
        quickKey: char("4"),
        label: "Fold level 4",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel4");
        },
    },
    {
        quickKey: char("5"),
        label: "Fold level 5",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel5");
        },
    },
    {
        quickKey: char("6"),
        label: "Fold level 6",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel6");
        },
    },
    {
        quickKey: char("7"),
        label: "Fold level 7",
        execute: async () => {
            await vscode.commands.executeCommand("editor.foldLevel7");
        },
    },
    {
        quickKey: char("0"),
        label: "Unfold all",
        execute: async () => {
            await vscode.commands.executeCommand("editor.unfoldAll");
        },
    },
];
