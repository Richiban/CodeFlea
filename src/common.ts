import { Config } from "./config";
import * as vscode from "vscode";

export type TextObject = vscode.Range;

export type DirectionOrNearest = Direction | "nearest";

export type SubTextRange = {
    text: string;
    range: { start: number; end: number };
};

export type Change = "greaterThan" | "lessThan";

export const Direction = {
    backwards: "backwards",
    forwards: "forwards",
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

export const IterationDirection = {
    ...Direction,
    alternate: "alternate",
} as const;

export type IterationDirection =
    typeof IterationDirection[keyof typeof IterationDirection];

export type RelativeIndentation =
    | "more-indentation"
    | "less-indentation"
    | "same-indentation"
    | "no-indentation";

export type IndentationRequest = RelativeIndentation | "any-indentation";

export type JumpPhaseType = "single-phase" | "dual-phase";

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

export function directionToDelta(direction: Direction) {
    return direction === "forwards"
        ? (x: number) => x + 1
        : (x: number) => x - 1;
}

export type ColourString = `#${string}`;

export type Skip =
    | { kind: "SkipTo"; char: Char }
    | { kind: "SkipOver"; char?: Char };