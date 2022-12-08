import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { SubjectActions } from "./SubjectActions";
import { SubjectType } from "./SubjectType";

export default abstract class Subject implements SubjectActions {
    constructor(protected context: common.ExtensionContext) {}

    protected abstract subjectReader: common.SubjectReader;
    protected abstract subjectWriter: common.SubjectWriter;
    public abstract decorationType: vscode.TextEditorDecorationType;
    public abstract name: SubjectType;

    async nextSubjectDown() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "forwards",
                })
                .tryFirst()
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterHorizontally(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "forwards",
                })
                .tryFirst()
        );
    }

    async nextSubjectUp() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                })
                .tryFirst()
        );
    }

    async nextSubjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterHorizontally(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                })
                .tryFirst()
        );
    }

    async addSubjectUp(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectUp();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async addSubjectDown() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectDown();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async addSubjectLeft(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectLeft();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async addSubjectRight() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectRight();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async swapSubjectDown() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectWriter.swapVertically(
                    this.context.editor.document,
                    e,
                    selection,
                    "forwards"
                )
            );
        });
    }
    async swapSubjectUp() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectWriter.swapVertically(
                    this.context.editor.document,
                    e,
                    selection,
                    "backwards"
                )
            );
        });
    }

    async swapSubjectLeft() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectWriter.swapHorizontally(
                    this.context.editor.document,
                    e,
                    selection,
                    "backwards"
                )
            );
        });
    }

    async swapSubjectRight() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectWriter.swapHorizontally(
                    this.context.editor.document,
                    e,
                    selection,
                    "forwards"
                )
            );
        });
    }

    async deleteSubject() {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                this.subjectWriter.remove(
                    this.context.editor.document,
                    e,
                    selection
                );
            }
        });

        this.fixSelection();
    }

    async duplicateSubject() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectWriter.duplicate(
                    this.context.editor.document,
                    e,
                    selection
                )
            );
        });
    }

    async firstSubjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterAll(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                    restrictToCurrentScope: true,
                })
                .tryLast()
        );
    }
    async lastSubjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterAll(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "forwards",
                    restrictToCurrentScope: true,
                })
                .tryLast()
        );
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader.search(this.context.editor.document, target, {
                startingPosition: selection.end,
                direction: "forwards",
            })
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader.search(this.context.editor.document, target, {
                startingPosition: selection.start,
                direction: "backwards",
            })
        );
    }

    async nextSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.moveSelectionToNextFindMatch"
        );
    }

    async prevSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.moveSelectionToPreviousFindMatch"
        );
    }

    async extendPrevSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.addSelectionToPreviousFindMatch"
        );
    }

    async extendNextSubjectMatch() {
        await vscode.commands.executeCommand(
            "editor.action.addSelectionToNextFindMatch"
        );
    }

    async fixSelection(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) => {
            const startRange = this.subjectReader.getContainingRangeAt(
                this.context.editor.document,
                selection.start
            );

            const endRange = this.subjectReader.getContainingRangeAt(
                this.context.editor.document,
                selection.end
            );

            const fixedRange =
                startRange && endRange
                    ? startRange.union(endRange)
                    : startRange
                    ? startRange
                    : endRange;

            if (fixedRange && !fixedRange.isEmpty) {
                return new vscode.Selection(fixedRange.end, fixedRange.start);
            }

            return this.subjectReader.getClosestRangeTo(
                this.context.editor.document,
                selection.start
            );
        });

        this.context.editor.setDecorations(
            this.decorationType,
            this.context.editor.selections
        );
    }

    clearUI(): void {
        this.context.editor.setDecorations(this.decorationType, []);
    }

    equals(other: Subject) {
        return this.name === other.name;
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return this.subjectReader.iterAll(this.context.editor.document, {
            startingPosition: this.context.editor.selection,
            direction,
        });
    }
}
