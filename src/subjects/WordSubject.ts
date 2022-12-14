import * as vscode from "vscode";
import WordIO from "../io/WordIO";
import SubjectBase from "./SubjectBase";

export default class WordSubject extends SubjectBase {
    protected subjectIO = new WordIO();
    public decorationType = WordSubject.decorationType;
    readonly name = "WORD";
    public readonly jumpPhaseType = "dual-phase";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #964d4d;",
        }
    );

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
        this.fixSelection();
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
        this.fixSelection();
    }
}
