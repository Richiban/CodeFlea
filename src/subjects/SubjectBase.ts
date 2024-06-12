import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { SubjectActions } from "./SubjectActions";
import { SubjectName } from "./SubjectName";
import Seq from "../utils/seq";
import SubjectIOBase from "../io/SubjectIOBase";
import { Direction, TextObject } from "../common";

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
                    direction: Direction.forwards,
                })
                .tryFirst()
        );
    }

    async nextObjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterHorizontally(this.context.editor.document, {
                    startingPosition: selection,
                    direction: Direction.forwards,
                })
                .tryFirst()
        );
    }

    async nextObjectUp() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection,
                    direction: Direction.backwards,
                })
                .tryFirst()
        );
    }

    async nextObjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterHorizontally(this.context.editor.document, {
                    startingPosition: selection,
                    direction: Direction.backwards,
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
                    Direction.forwards
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
                    Direction.backwards
                )
            );
        });
    }

    async swapWithObjectToLeft() {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                this.subjectIO.swapHorizontally(
                    this.context.editor.document,
                    e,
                    selection,
                    Direction.backwards
                );
            }
        });

        await this.nextObjectLeft();
    }

    async swapWithObjectToRight() {
        await this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                this.subjectIO.swapHorizontally(
                    this.context.editor.document,
                    e,
                    selection,
                    Direction.forwards
                );
            }
        });

        await this.nextObjectRight();
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

        await this.fixSelection();
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
                    direction: Direction.backwards,
                })
                .tryLast()
        );
    }
    async lastObjectInScope(): Promise<void> {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterScope(this.context.editor.document, {
                    startingPosition: selection,
                    direction: Direction.forwards,
                })
                .tryLast()
        );
    }

    async skip(direction: common.Direction, target: common.Skip) {
        if (target.kind === "SkipTo") {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.skip(this.context.editor.document, target.char, {
                    startingPosition: selections.rangeToPosition(
                        selection,
                        direction
                    ),
                    direction,
                })
            );
        } else {
            selections.tryMap(this.context.editor, (selection) =>
                this.subjectIO.skipOver(
                    this.context.editor.document,
                    target.char,
                    {
                        startingPosition: selections.rangeToPosition(
                            selection,
                            direction
                        ),
                        direction,
                    }
                )
            );
        }
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

    async fixSelection(half?: "LEFT" | "RIGHT"): Promise<void> {
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
                half === "LEFT"  && startRange ? new vscode.Range(startRange.start, selection.start) :
                half === "RIGHT" && endRange ? new vscode.Range(selection.end, endRange.end) :
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
    ): Seq<TextObject> {
        if (direction === common.IterationDirection.alternate) {
            return this.subjectIO
                .iterAll(this.context.editor.document, {
                    startingPosition: this.context.editor.selection.start,
                    direction: Direction.forwards,
                    bounds,
                })
                .alternateWith(
                    this.subjectIO.iterAll(this.context.editor.document, {
                        startingPosition: this.context.editor.selection.start,
                        direction: Direction.backwards,
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
