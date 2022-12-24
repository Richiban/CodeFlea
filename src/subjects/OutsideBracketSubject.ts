import SubjectBase from "./SubjectBase";
import BracketIO from "../io/BracketIO";
import * as vscode from "vscode";

export const decorationType = vscode.window.createTextEditorDecorationType({
    border: "1px dashed #9900ff;",
});

export default class OutsideBracketSubject extends SubjectBase {
    protected subjectIO = new BracketIO(true);
    public decorationType = decorationType;
    readonly name = "BRACKETS_INCLUSIVE";
    public readonly displayName = "outside brackets";
    public readonly jumpPhaseType = "single-phase";
}