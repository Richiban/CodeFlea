import * as vscode from "vscode";
import wordWriter from "../writers/words";
import Subject from "./Subject";
import wordReader from "../readers/words";

export default class WordSubject extends Subject {
    protected subjectReader = wordReader;
    protected subjectWriter = wordWriter;
    public decorationType = WordSubject.decorationType;
    readonly name = "WORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #964d4d;",
        }
    );

    public static quickNumberDecoration =
        vscode.window.createTextEditorDecorationType({});

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
        this.fixSelection();
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
        this.fixSelection();
    }
}
