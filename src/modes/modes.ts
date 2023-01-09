import * as vscode from "vscode";
import { Direction } from "../common";
import { SubjectAction } from "../subjects/SubjectActions";
import { SubjectType } from "../subjects/SubjectType";

export type EditorModeType = "NULL" | "INSERT" | "FLEA" | "EXTEND";

export type EditorModeChangeRequest =
    | { kind: "INSERT" }
    | { kind: "FLEA" | "EXTEND"; subjectName?: SubjectType };

export abstract class EditorMode implements vscode.Disposable {
    abstract readonly name: EditorModeType;
    abstract readonly statusBarText: string;
    abstract readonly cursorStyle: vscode.TextEditorCursorStyle | undefined;
    abstract readonly decorationType?: vscode.TextEditorDecorationType;

    abstract equals(previousMode: EditorMode): boolean;
    abstract changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode>;
    async dispose(): Promise<void> {}
    async fixSelection() {}

    abstract executeSubjectCommand(command: SubjectAction): Promise<void>;

    skip(direction: Direction): Promise<void> {
        return Promise.resolve();
    }

    repeatLastSkip(direction: Direction): Promise<void> {
        return Promise.resolve();
    }

    jump(): Promise<void> {
        return Promise.resolve();
    }
}
