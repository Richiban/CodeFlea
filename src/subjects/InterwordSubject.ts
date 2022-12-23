import * as vscode from "vscode";
import InterwordIO from "../io/InterwordIO";
import SubjectBase from "./SubjectBase";

const decorationType = vscode.window.createTextEditorDecorationType({
    border: "2px dotted #964d4d;",
});

export default class InterwordSubject extends SubjectBase {
    protected subjectIO = new InterwordIO();
    public decorationType = decorationType;
    public readonly name = "INTERWORD";
    public readonly displayName = "inter-word";
    public readonly jumpPhaseType = "single-phase";
}
