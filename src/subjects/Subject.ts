import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { SubjectActions } from "./SubjectActions";
import { SubjectType } from "./SubjectType";

export abstract class Subject implements SubjectActions, vscode.Disposable {
    constructor(protected context: common.ExtensionContext) {}

    dispose() {}

    async nextSubjectDown() {}
    async nextSubjectUp() {}
    async nextSubjectLeft() {}
    async nextSubjectRight() {}
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

    async swapSubjectDown() {}
    async swapSubjectUp() {}
    async swapSubjectLeft() {}
    async swapSubjectRight() {}
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
    async search(target: string) {}
    async searchBackwards(target: string) {}

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

    abstract name: SubjectType;
    abstract fixSelection(): Promise<void>;
    abstract clearUI(): void;

    equals(other: Subject) {
        return this.name === other.name;
    }

    abstract iterAll(direction: common.Direction): common.Linqish<vscode.Range>;
}
