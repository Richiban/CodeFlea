import * as vscode from "vscode";
import * as lines from "../readers/lines";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { Subject } from "./Subject";
import allLinesReader from "../readers/allLines";
import allLinesWriter from "../writers/allLines";

export class AllLinesSubject extends Subject {
    protected subjectReader = allLinesReader;
    protected subjectWriter = allLinesWriter;
    public decorationType = AllLinesSubject.decorationType;
    readonly name = "ALL_LINES";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px dashed #8feb34;",
        }
    );

    clearUI() {
        this.context.editor.setDecorations(AllLinesSubject.decorationType, []);
    }

    async fixSelection() {
        selections.tryMap(this.context.editor, (selection) => {
            const startLine = this.context.editor.document.lineAt(
                selection.start.line
            );
            const endLine = this.context.editor.document.lineAt(
                selection.end.line
            );

            return new vscode.Selection(
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                ),
                endLine.range.end
            );
        });

        const decorations = this.context.editor.selections.map((selection) => {
            if (selection.isEmpty) {
                return new vscode.Selection(
                    selection.anchor,
                    selection.anchor.translate(0, 100)
                );
            } else {
                return selection;
            }
        });

        this.context.editor.setDecorations(
            AllLinesSubject.decorationType,
            decorations
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async addSubjectDown() {
        await vscode.commands.executeCommand("editor.action.insertCursorBelow");
    }

    async addSubjectUp() {
        await vscode.commands.executeCommand("editor.action.insertCursorAbove");
    }

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
    }
}
