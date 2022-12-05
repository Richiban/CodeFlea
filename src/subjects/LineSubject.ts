import * as vscode from "vscode";
import lineWriter from "../writers/lines";
import { Subject } from "./Subject";
import lineReader from "../readers/lines";

export class LineSubject extends Subject {
    protected subjectReader = lineReader;
    protected subjectWriter = lineWriter;
    protected decorationType = LineSubject.decorationType;
    readonly name = "LINE";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #8feb34;",
        }
    );

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
    }

    async swapSubjectDown() {
        await vscode.commands.executeCommand(
            "editor.action.moveLinesDownAction"
        );
    }

    async swapSubjectUp() {
        await vscode.commands.executeCommand("editor.action.moveLinesUpAction");
    }
}
