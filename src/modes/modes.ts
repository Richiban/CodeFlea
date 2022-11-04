import * as subjects from "../subjects/subjects";
import ModeManager from "./ModeManager";

export type EditorModeName = "EDIT" | "NAVIGATE" | "EXTEND";

export type EditorMode = {
    changeTo(newMode: EditorModeName): EditorMode;
    refreshUI(editorManager: ModeManager): void;
    onCharTyped(typed: { text: string }): EditorMode;
    changeSubject(subject: subjects.SubjectName): void;
    executeSubjectCommand(command: keyof subjects.Subject): Promise<void>;
};
