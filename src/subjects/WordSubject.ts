import * as vscode from "vscode";
import wordWriter from "../writers/words";
import { Subject } from "./Subject";
import wordReader from "../readers/words";

export class WordSubject extends Subject {
    protected subjectReader = wordReader;
    protected subjectWriter = wordWriter;
    protected decorationType = WordSubject.decorationType;
    readonly name = "WORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #964d4d;",
        }
    );

    public static quickNumberDecoration =
        vscode.window.createTextEditorDecorationType({});

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
    }
}
