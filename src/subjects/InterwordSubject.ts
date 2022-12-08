import * as vscode from "vscode";
import Subject from "./Subject";
import interwordReader from "../readers/interwords";
import interwordWriter from "../writers/interwords";

export default class InterwordSubject extends Subject {
    protected subjectReader = interwordReader;
    protected subjectWriter = interwordWriter;
    public decorationType = InterwordSubject.decorationType;
    readonly name = "INTERWORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "2px dotted #964d4d;",
        }
    );
}
