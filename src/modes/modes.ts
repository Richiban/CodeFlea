import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import ModeManager from "./ModeManager";

export type EditorModeType =
    | { kind: "EDIT" }
    | { kind: "NAVIGATE" | "EXTEND"; subjectName: subjects.SubjectType };

export abstract class EditorMode {
    abstract equals(previousMode: EditorMode): boolean;
    abstract changeTo(newMode: EditorModeType): Promise<EditorMode>;
    abstract refreshUI(editorManager: ModeManager): void;
    async end(): Promise<void> {}

    onCharTyped(typed: { text: string }): EditorMode {
        vscode.commands.executeCommand("default:type", typed);

        return this;
    }

    abstract executeSubjectCommand(
        command: keyof subjects.SubjectActions
    ): Promise<void>;
}
