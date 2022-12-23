import * as vscode from "vscode";
import SubjectBase from "./SubjectBase";
import BracketIO from "../io/BracketIO";

export const decorationType = vscode.window.createTextEditorDecorationType({
    border: "1px dashed #9900ff;",
});

export default class BracketSubject extends SubjectBase {
    protected subjectIO = new BracketIO(false);
    public decorationType = decorationType;
    readonly name = "BRACKETS";
    public readonly jumpPhaseType = "single-phase";
}
