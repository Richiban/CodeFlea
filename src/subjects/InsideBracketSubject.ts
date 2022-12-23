import * as vscode from "vscode";
import SubjectBase from "./SubjectBase";
import BracketIO from "../io/BracketIO";

const decorationType = vscode.window.createTextEditorDecorationType({
    border: "1px dashed #9900ff;",
});

export default class InsideBracketSubject extends SubjectBase {
    protected subjectIO = new BracketIO(false);
    public decorationType = decorationType;
    readonly name = "BRACKETS";
    public readonly displayName = "inside brackets";
    public readonly jumpPhaseType = "single-phase";
}
