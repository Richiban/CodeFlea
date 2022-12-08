import { Config } from "./config";
import * as vscode from "vscode";
import Linqish from "./utils/Linqish";

export type DirectionOrNearest = Direction | "nearest";

export type SubTextRange = {
    text: string;
    range: { start: number; end: number };
};

export type Change = "greaterThan" | "lessThan";

export const Direction = {
    backwards: "backwards",
    forwards: "forwards",
};

export type Direction = typeof Direction[keyof typeof Direction];

export type RelativeIndentation =
    | "more-indentation"
    | "less-indentation"
    | "same-indentation"
    | "no-indentation";

export type IndentationRequest = RelativeIndentation | "any-indentation";

export type IterationOptions = {
    startingPosition: vscode.Range | vscode.Position;
    direction: Direction;
    currentInclusive?: boolean;
    restrictToCurrentScope?: boolean;
    bounds?: vscode.Range;
};

export type SubjectReader = {
    getContainingRangeAt(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Range | undefined;
    getClosestRangeTo(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Range;
    iterAll(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Linqish<vscode.Range>;
    iterHorizontally(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Linqish<vscode.Range>;
    iterVertically(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Linqish<vscode.Range>;
    search(
        document: vscode.TextDocument,
        targetChar: Char,
        options: IterationOptions
    ): vscode.Range | undefined;
};

export type SubjectWriter = {
    remove(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        range: vscode.Range
    ): void;
    duplicate(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        range: vscode.Range
    ): vscode.Range;
    swapVertically(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        range: vscode.Range,
        direction: Direction
    ): vscode.Range;
    swapHorizontally(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        range: vscode.Range,
        direction: Direction
    ): vscode.Range;
};

export type JumpLocations = JumpLocation[];

export type JumpLocation = {
    jumpCode: string;
    position: vscode.Position;
};

export type Parameter<T> = T extends (arg: infer U) => any ? U : never;

export type ExtensionContext = {
    statusBar: vscode.StatusBarItem;
    config: Config;
    editor: vscode.TextEditor;
};

export type Char = string & { length: 1 };

export function opposite(direction: Direction) {
    return direction === "forwards" ? "backwards" : "forwards";
}

export function getJumpCodes(config: Config) {
    return config.jump.characters.split(/[\s,]+/);
}

export function directionToDelta(direction: Direction) {
    return direction === "forwards"
        ? (x: number) => x + 1
        : (x: number) => x - 1;
}
