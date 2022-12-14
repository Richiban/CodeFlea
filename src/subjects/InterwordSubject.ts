import * as vscode from "vscode";
import InterwordIO from "../io/InterwordIO";
import SubjectBase from "./SubjectBase";
import * as common from "../common";

export default class InterwordSubject extends SubjectBase {
    protected subjectIO = new InterwordIO();
    public decorationType = InterwordSubject.decorationType;
    readonly name = "INTERWORD";
    public readonly jumpPhaseType = "single-phase";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "2px dotted #964d4d;",
        }
    );
}
