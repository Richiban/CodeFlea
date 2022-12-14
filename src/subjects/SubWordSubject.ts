import * as vscode from "vscode";
import SubwordIO from "../io/SubwordIO";
import SubjectBase from "./SubjectBase";
import * as common from "../common";

export default class SubwordSubject extends SubjectBase {
    readonly name = "SUBWORD";
    public decorationType = SubwordSubject.decorationType;
    protected readonly subjectIO = new SubwordIO();
    public readonly jumpPhaseType = "dual-phase";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #9900ff;",
        }
    );

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastSubjectInScope() {
        await vscode.commands.executeCommand("cursorEnd");
    }
}
