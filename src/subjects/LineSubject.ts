import * as vscode from "vscode";
import * as lines from "../utils/lines";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { Subject } from "./Subject";

export class LineSubject extends Subject {
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

    async duplicateSubject(): Promise<void> {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                lines.duplicate(this.context.editor.document, e, selection);
            }
        });
    }

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
                endLine.range.end,
                new vscode.Position(
                    startLine.lineNumber,
                    startLine.firstNonWhitespaceCharacterIndex
                )
            );
        });

        this.context.editor.setDecorations(
            LineSubject.decorationType,
            this.context.editor.selections
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    async nextSubjectDown() {
        selections.tryMap(
            this.context.editor,
            (selection) =>
                lines.getNextSignificantLine(
                    this.context.editor.document,
                    selection.end,
                    "forwards"
                )?.range
        );
    }

    async nextSubjectUp() {
        selections.tryMap(
            this.context.editor,
            (selection) =>
                lines.getNextSignificantLine(
                    this.context.editor.document,
                    selection.end,
                    "backwards"
                )?.range
        );
    }

    async nextSubjectLeft() {
        selections.tryMap(
            this.context.editor,
            (selection) =>
                lines
                    .iterHorizontally(this.context.editor, {
                        fromPosition: selection.start,
                        direction: "backwards",
                    })
                    .tryFirst()?.range
        );
    }

    async nextSubjectRight() {
        selections.tryMap(
            this.context.editor,
            (selection) =>
                lines
                    .iterHorizontally(this.context.editor, {
                        fromPosition: selection.start,
                        direction: "forwards",
                    })
                    .tryFirst()?.range
        );
    }

    async swapSubjectLeft() {
        const newSelections: vscode.Selection[] = [];

        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                const newSelection = lines.swapLineSideways(
                    this.context.editor.document,
                    selection.start,
                    e,
                    "left"
                );

                if (newSelection) {
                    newSelections.push(
                        new vscode.Selection(
                            newSelection.start,
                            newSelection.end
                        )
                    );
                }
            }
        });

        this.context.editor.selections = newSelections;
    }
    async swapSubjectRight() {
        const newSelections: vscode.Selection[] = [];

        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                const newSelection = lines.swapLineSideways(
                    this.context.editor.document,
                    selection.start,
                    e,
                    "right"
                );

                if (newSelection) {
                    newSelections.push(
                        new vscode.Selection(
                            newSelection.start,
                            newSelection.end
                        )
                    );
                }
            }
        });

        this.context.editor.selections = newSelections;
    }

    async swapSubjectDown() {
        await vscode.commands.executeCommand(
            "editor.action.moveLinesDownAction"
        );
    }

    async swapSubjectUp() {
        await vscode.commands.executeCommand("editor.action.moveLinesUpAction");
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            lines.search(
                this.context.editor,
                selection.start,
                target,
                "forwards"
            )
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            lines.search(
                this.context.editor,
                selection.end,
                target,
                "backwards"
            )
        );
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return lines
            .iterLines(
                this.context.editor.document,
                this.context.editor.selection.start.line,
                direction
            )
            .filter((line) => lines.lineIsSignificant(line))
            .map((line) => line.range);
    }
}
