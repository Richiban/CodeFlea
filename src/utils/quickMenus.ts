import * as vscode from "vscode";
import { scrollToCursorAtCenter } from "./editor";

export type QuickCommand = {
    quickKey: string;
    label: string;
    execute: () => Promise<void>;
};

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
                "editor.}action.goToTypeDefinition"
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
];

export const SpaceCommands: QuickCommand[] = [
    {
        quickKey: " ",
        label: "center editor",
        execute: async () => {
            scrollToCursorAtCenter();
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
];
