import * as vscode from "vscode";
import LineIO from "../io/LineIO";
import * as selections from "../utils/selectionsAndRanges";
import SubjectBase from "./SubjectBase";

export default class LineSubject extends SubjectBase {
    protected subjectIO = new LineIO();
    public outlineColour = { dark: "#8feb34", light: "#66CDAA" } as const;
    public readonly name = "LINE";
    public readonly displayName = "line";
    public readonly jumpPhaseType = "single-phase";

    async fixSelection() {
        selections.tryMap(this.context.editor, (selection) => {
            const startLine = this.context.editor.document.lineAt(
                selection.start.line
            );
            const endLine = this.context.editor.document.lineAt(
                selection.end.line
            );

            return new vscode.Selection(
                endLine.range.end,
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                )
            );
        });
    }

    async nextObjectUp() {
        await vscode.commands.executeCommand("cursorUp");
        this.fixSelection();
    }

    async nextObjectDown() {
        await vscode.commands.executeCommand("cursorDown");
        this.fixSelection();
    }

    async addObjectBelow() {
        await vscode.commands.executeCommand("editor.action.insertCursorBelow");
        this.fixSelection();
    }

    async addObjectAbove() {
        await vscode.commands.executeCommand("editor.action.insertCursorAbove");
        this.fixSelection();
    }

    async deleteObject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
        this.fixSelection();
    }

    async swapWithObjectAbove(): Promise<void> {
        await vscode.commands.executeCommand("editor.action.moveLinesUpAction");
        this.fixSelection();
    }

    async swapWithObjectBelow(): Promise<void> {
        await vscode.commands.executeCommand(
            "editor.action.moveLinesDownAction"
        );
        this.fixSelection();
    }
}
