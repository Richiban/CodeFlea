import * as vscode from "vscode";
import SubwordIO from "../io/SubwordIO";
import SubjectBase from "./SubjectBase";

const decorationType = vscode.window.createTextEditorDecorationType({
    border: "1px solid #9900ff;",
});

export default class SubwordSubject extends SubjectBase {
    public readonly name = "SUBWORD";
    public readonly displayName = "subword";
    public decorationType = decorationType;
    protected readonly subjectIO = new SubwordIO();
    public readonly jumpPhaseType = "dual-phase";

    async nextObjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextObjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async firstObjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastObjectInScope() {
        await vscode.commands.executeCommand("cursorEnd");
    }
}
