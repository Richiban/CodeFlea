import * as subjects from "../subjects/subjects";
import ModeManager from "./ModeManager";

export type EditorModeType =
    | { kind: "EDIT" }
    | { kind: "NAVIGATE"; subjectName: subjects.SubjectType };

export type EditorMode = {
    equals(previousMode: EditorMode): boolean;
    changeTo(newMode: EditorModeType): Promise<EditorMode>;
    refreshUI(editorManager: ModeManager): void;
    onCharTyped(typed: { text: string }): EditorMode;
    executeSubjectCommand(command: keyof subjects.Subject): Promise<void>;
};
