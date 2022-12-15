import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { SubjectActions } from "./SubjectActions";
import { SubjectType } from "./SubjectType";
import Linqish from "../utils/Linqish";
import SubjectIOBase from "../io/SubjectIOBase";

export default abstract class SubjectBase implements SubjectActions {
    constructor(protected context: common.ExtensionContext) {}

    protected abstract subjectIO: SubjectIOBase;
    public abstract decorationType: vscode.TextEditorDecorationType;
    public abstract name: SubjectType;
    public abstract jumpPhaseType: common.JumpPhaseType;

    async nextObjectDown() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "forwards",
                })
                .tryFirst()
        );
    }

    async nextObjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterHorizontally(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "forwards",
                })
                .tryFirst()
        );
    }

    async nextObjectUp() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                })
                .tryFirst()
        );
    }

    async nextObjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterHorizontally(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                })
                .tryFirst()
        );
    }

    async addObjectAbove(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextObjectUp();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async addObjectBelow() {
        const existingSelections = this.context.editor.selections;

        await this.nextObjectDown();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async addObjectToLeft(): Promise<void> {
        const existingSelections = this.context.editor.selections;

        await this.nextObjectLeft();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async addObjectToRight() {
        const existingSelections = this.context.editor.selections;

        await this.nextObjectRight();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    async swapWithObjectBelow() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.swapVertically(
                    this.context.editor.document,
                    e,
                    selection,
                    "forwards"
                )
            );
        });
    }
    async swapWithObjectAbove() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.swapVertically(
                    this.context.editor.document,
                    e,
                    selection,
                    "backwards"
                )
            );
        });
    }

    async swapWithObjectToLeft() {
        const newSelections: vscode.Selection[] = [];

        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                const s = this.subjectIO.swapHorizontally(
                    this.context.editor.document,
                    e,
                    selection,
                    "backwards"
                );

                newSelections.push(new vscode.Selection(s.end, s.start));
            }
        });

        this.context.editor.selections = newSelections;
    }

    async swapWithObjectToRight() {
        const newSelections: vscode.Selection[] = [];

        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                const s = this.subjectIO.swapHorizontally(
                    this.context.editor.document,
                    e,
                    selection,
                    "forwards"
                );

                newSelections.push(new vscode.Selection(s.end, s.start));
            }
        });

        this.context.editor.selections = newSelections;
    }

    async deleteObject() {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                this.subjectIO.deleteObject(
                    this.context.editor.document,
                    e,
                    selection
                );
            }
        });

        this.fixSelection();
    }

    async duplicateObject() {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.duplicate(
                    this.context.editor.document,
                    e,
                    selection
                )
            );
        });
    }

    async firstObjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterAll(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                    restrictToCurrentScope: true,
                })
                .tryLast()
        );
    }
    async lastObjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
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
            this.subjectIO.search(this.context.editor.document, target, {
                startingPosition: selection.end,
                direction: "forwards",
            })
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO.search(this.context.editor.document, target, {
                startingPosition: selection.start,
                direction: "backwards",
            })
        );
    }

    async nextOccurrenceOfObject() {
        await vscode.commands.executeCommand(
            "editor.action.moveSelectionToNextFindMatch"
        );
    }

    async prevOccurrenceOfObject() {
        await vscode.commands.executeCommand(
            "editor.action.moveSelectionToPreviousFindMatch"
        );
    }

    async extendPrevOccurrenceOfObject() {
        await vscode.commands.executeCommand(
            "editor.action.addSelectionToPreviousFindMatch"
        );
    }

    async extendNextOccurrenceOfObject() {
        await vscode.commands.executeCommand(
            "editor.action.addSelectionToNextFindMatch"
        );
    }

    async fixSelection(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) => {
            const startRange = this.subjectIO.getContainingObjectAt(
                this.context.editor.document,
                selection.start
            );

            const endRange = this.subjectIO.getContainingObjectAt(
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

            return this.subjectIO.getClosestObjectTo(
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

    equals(other: SubjectBase) {
        return this.name === other.name;
    }

    iterAll(direction: common.IterationDirection): Linqish<vscode.Range> {
        if (direction === common.IterationDirection.alternate) {
            return this.subjectIO
                .iterAll(this.context.editor.document, {
                    startingPosition: this.context.editor.selection,
                    direction: "forwards",
                })
                .alternateWith(
                    this.subjectIO.iterAll(this.context.editor.document, {
                        startingPosition: this.context.editor.selection,
                        direction: "backwards",
                    })
                );
        }

        return this.subjectIO.iterAll(this.context.editor.document, {
            startingPosition: this.context.editor.selection,
            direction,
        });
    }
}
