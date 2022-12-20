import * as common from "../common";
import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import SubjectBase from "./SubjectBase";
import BracketIO from "../io/BracketIO";

const decorationType = vscode.window.createTextEditorDecorationType({
    border: "1px dashed #aba246;",
});

export default class BracketSubject extends SubjectBase {
    protected subjectIO = new BracketIO();
    public decorationType = decorationType;
    readonly name = "BRACKETS";
    public readonly jumpPhaseType = "single-phase";
}
