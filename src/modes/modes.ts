import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";

export type EditorModeType =
    | { kind: "EDIT" }
    | { kind: "NAVIGATE" | "EXTEND"; subjectName: subjects.SubjectType };

export abstract class EditorMode implements vscode.Disposable {
    protected lastCommand:
        | { commandName: keyof subjects.SubjectActions; args: string[] }
        | undefined;

    abstract equals(previousMode: EditorMode): boolean;
    abstract changeTo(newMode: EditorModeType): Promise<EditorMode>;
    abstract clearUI(): void;
    abstract refreshUI(): void;
    async dispose(): Promise<void> {}
    async fixSelection() {}
    abstract copy(): EditorMode;

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    abstract executeSubjectCommand(
        command: keyof subjects.SubjectActions
    ): Promise<void>;

    abstract repeatSubjectCommand(): Promise<void>;
}
