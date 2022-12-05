import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { SubjectActions } from "./SubjectActions";
import { SubjectType } from "./SubjectType";

export abstract class Subject implements SubjectActions {
    constructor(protected context: common.ExtensionContext) {}

    protected abstract subjectReader: common.SubjectReader;
    protected abstract subjectWriter: common.SubjectWriter;
    protected abstract decorationType: vscode.TextEditorDecorationType;
    public abstract name: SubjectType;

    async nextSubjectDown() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterHorizontally(
                    this.context.editor.document,
                    selection.start,
                    "backwards"
                )
                .tryFirst()
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader
                .iterHorizontally(
                    this.context.editor.document,
                    selection.end,
                    "forwards"
                )
                .tryFirst()
        );
    }
    async nextSubjectUp() {}
    async nextSubjectLeft() {}
    async addSubjectDown() {}
    async addSubjectUp() {}
    async addSubjectLeft() {}
    async addSubjectRight() {}

    async extendSubjectUp(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectUp();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectDown() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectDown();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectLeft(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectLeft();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async extendSubjectRight() {
        const existingSelections = this.context.editor.selections;

        await this.nextSubjectRight();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async swapSubjectDown() {
        this.context.editor.edit((e) => {
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
        this.context.editor.edit((e) => {
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
        this.context.editor.edit((e) => {
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
        this.context.editor.edit((e) => {
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
        await vscode.commands.executeCommand("deleteLeft");
    }

    async duplicateSubject() {
        await vscode.commands.executeCommand(
            "editor.action.duplicateSelection"
        );
    }

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async firstSubjectInScope() {}
    async lastSubjectInScope() {}

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader.search(
                this.context.editor.document,
                selection.end,
                target,
                "forwards"
            )
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectReader.search(
                this.context.editor.document,
                selection.start,
                target,
                "backwards"
            )
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

            return fixedRange ?? selection;
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
        return this.subjectReader.iterAll(
            this.context.editor.document,
            this.context.editor.selection.start,
            direction
        );
    }
}
