import * as vscode from "vscode";
import { SubjectAction } from "../subjects/SubjectActions";
import { SubjectType } from "../subjects/SubjectType";

export type EditorModeChangeRequest =
    | { kind: "EDIT" }
    | { kind: "NAVIGATE" | "EXTEND"; subjectName: SubjectType };

export abstract class EditorMode implements vscode.Disposable {
    abstract equals(previousMode: EditorMode): boolean;
    abstract changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode>;
    abstract changeNumHandler(): EditorMode;
    abstract clearUI(): void;
    abstract setUI(): void;
    async dispose(): Promise<void> {}
    async fixSelection() {}

    onCharTyped(typed: { text: string }): EditorMode | undefined {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    abstract executeSubjectCommand(command: SubjectAction): Promise<void>;

    abstract repeatSubjectCommand(): Promise<void>;

    jump() {}
}
