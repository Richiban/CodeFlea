import * as vscode from "vscode";
import WordIO from "../io/WordIO";
import SubjectBase from "./SubjectBase";

const decorationType = vscode.window.createTextEditorDecorationType({
    border: "1px solid #964d4d;",
});

export default class WordSubject extends SubjectBase {
    protected subjectIO = new WordIO();
    public readonly decorationType = decorationType;
    readonly name = "WORD";
    public readonly jumpPhaseType = "dual-phase";

    async firstObjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
        this.fixSelection();
    }

    async lastObjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
        this.fixSelection();
    }
}
