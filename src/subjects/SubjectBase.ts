import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { SubjectActions } from "./SubjectActions";
import { SubjectName } from "./SubjectName";
import Enumerable from "../utils/Enumerable";
import SubjectIOBase from "../io/SubjectIOBase";

export default abstract class SubjectBase implements SubjectActions {
    constructor(protected context: common.ExtensionContext) {}

    protected abstract subjectIO: SubjectIOBase;
    public abstract outlineColour: {
        dark: common.ColourString;
        light: common.ColourString;
    };
    public abstract name: SubjectName;
    public abstract jumpPhaseType: common.JumpPhaseType;
    public abstract readonly displayName: string;

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

    async prependNew(): Promise<void> {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.insertNew(
                    this.context.editor.document,
                    e,
                    selection,
                    common.Direction.backwards
                )
            );
        });
    }

    async appendNew(): Promise<void> {
        await this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.insertNew(
                    this.context.editor.document,
                    e,
                    selection,
                    common.Direction.forwards
                )
            );
        });
    }

    async firstObjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterScope(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "backwards",
                })
                .tryLast()
        );
    }
    async lastObjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterScope(this.context.editor.document, {
                    startingPosition: selection,
                    direction: "forwards",
                })
                .tryLast()
        );
    }

    async skip(direction: common.Direction, target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO.skip(this.context.editor.document, target, {
                startingPosition: selection.end,
                direction,
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
    }

    equals(other: SubjectBase) {
        return this.name === other.name;
    }

    iterAll(
        direction: common.IterationDirection,
        bounds: vscode.Range
    ): Enumerable<vscode.Range> {
        if (direction === common.IterationDirection.alternate) {
            return this.subjectIO
                .iterAll(this.context.editor.document, {
                    startingPosition: this.context.editor.selection,
                    direction: "forwards",
                    bounds,
                })
                .alternateWith(
                    this.subjectIO.iterAll(this.context.editor.document, {
                        startingPosition: this.context.editor.selection,
                        direction: "backwards",
                        bounds,
                    })
                );
        }

        return this.subjectIO.iterAll(this.context.editor.document, {
            startingPosition: this.context.editor.selection,
            direction,
        });
    }
}
