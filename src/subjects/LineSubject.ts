import * as vscode from "vscode";
import LineIO, * as lines from "../io/LineIO";
import * as selections from "../utils/selectionsAndRanges";
import SubjectBase from "./SubjectBase";

export default class LineSubject extends SubjectBase {
    protected subjectIO = new LineIO();
    public decorationType = LineSubject.decorationType;
    readonly name = "LINE";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #8feb34;",
        }
    );

    clearUI() {
        this.context.editor.setDecorations(LineSubject.decorationType, []);
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
            LineSubject.decorationType,
            decorations
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
        this.fixSelection();
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
        this.fixSelection();
    }

    async addSubjectDown() {
        await vscode.commands.executeCommand("editor.action.insertCursorBelow");
        this.fixSelection();
    }

    async addSubjectUp() {
        await vscode.commands.executeCommand("editor.action.insertCursorAbove");
        this.fixSelection();
    }

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
        this.fixSelection();
    }
}
