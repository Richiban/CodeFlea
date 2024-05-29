import * as vscode from "vscode";
import { Direction } from "../common";
import { SubjectAction } from "../subjects/SubjectActions";
import { SubjectName } from "../subjects/SubjectName";

export type EditorModeType = "NULL" | "INSERT" | "COMMAND" | "EXTEND";

export type EditorModeChangeRequest =
    | { kind: "INSERT" }
    | { kind: "COMMAND" | "EXTEND"; subjectName?: SubjectName };
    export abstract class EditorMode implements vscode.Disposable {
        
    abstract readonly name: EditorModeType;
    abstract readonly statusBarText: string;
    abstract readonly cursorStyle: vscode.TextEditorCursorStyle | undefined;
    abstract readonly decorationType?: vscode.TextEditorDecorationType;
    abstract readonly decorationTypeTop?: vscode.TextEditorDecorationType;
    abstract readonly decorationTypeMid?: vscode.TextEditorDecorationType;
    abstract readonly decorationTypeBottom?: vscode.TextEditorDecorationType;

    abstract equals(previousMode: EditorMode): boolean;
    abstract changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode>;
    async dispose(): Promise<void> {}
    async fixSelection() {}

    abstract executeSubjectCommand(command: SubjectAction): Promise<void>;

    abstract skip(direction: Direction): Promise<void>;
    abstract skipOver(direction: string): Promise<void>;
    abstract repeatLastSkip(direction: Direction): Promise<void>;
    abstract jump(): Promise<void>;
    abstract jumpToSubject(subjectName: string): Promise<EditorMode | undefined>;

}
