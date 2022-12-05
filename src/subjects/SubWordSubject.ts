import * as vscode from "vscode";
import subwordReader from "../readers/subwords";
import subwordWriter from "../writers/subwords";
import { Subject } from "./Subject";

export class SubwordSubject extends Subject {
    readonly name = "SUBWORD";
    protected decorationType = SubwordSubject.decorationType;
    protected readonly subjectReader = subwordReader;
    protected readonly subjectWriter = subwordWriter;

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "2px dotted #964d4d;",
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
