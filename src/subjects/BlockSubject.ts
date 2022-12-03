import * as blocks from "../utils/blocks";
import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as editor from "../utils/editor";
import * as common from "../common";
import { Subject } from "./Subject";

export class BlockSubject extends Subject {
    readonly name = "BLOCK";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #aba246;",
        }
    );

    clearUI() {
        this.context.editor.setDecorations(BlockSubject.decorationType, []);
    }

    async fixSelection() {
        selections.tryMap(this.context.editor, (selection) => {
            const startBlock = blocks.getContainingBlock(
                this.context.editor,
                selection.start
            );
            const endBlock = blocks.getContainingBlock(
                this.context.editor,
                selection.end
            );

            const newBlock = startBlock.union(endBlock);

            return new vscode.Selection(newBlock.end, newBlock.start);
        });

        this.context.editor.setDecorations(
            BlockSubject.decorationType,
            this.context.editor.selections
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    async nextSubjectDown() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterVertically(this.context.editor, {
                    direction: "forwards",
                    fromPosition: selection.start,
                })
                .tryFirst()
        );
    }

    async nextSubjectUp() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterVertically(this.context.editor, {
                    direction: "backwards",
                    fromPosition: selection.start,
                })
                .skip(1)
                .tryFirst()
        );
    }

    async nextSubjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterHorizontally(this.context.editor, {
                    direction: "backwards",
                    fromPosition: selection.start,
                })
                .tryFirst()
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterHorizontally(this.context.editor, {
                    direction: "forwards",
                    fromPosition: selection.start,
                })
                .tryFirst()
        );
    }

    async swapSubjectDown() {
        this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(
                    this.context.editor,
                    selection.start
                );

                const nextBlock = blocks
                    .iterVertically(this.context.editor, {
                        fromPosition: selection.start,
                        direction: "forwards",
                    })
                    .tryFirst();

                if (!nextBlock) {
                    return selection;
                }

                editor.swap(
                    this.context.editor.document,
                    e,
                    thisBlock,
                    nextBlock
                );

                return new vscode.Selection(nextBlock.end, nextBlock.start);
            });
        });
    }

    async swapSubjectLeft() {
        this.context.editor.edit((textEdit) => {
            selections.tryMap(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(
                    this.context.editor,
                    selection.start
                );

                const targetBlock = blocks
                    .iterHorizontally(this.context.editor, {
                        fromPosition: selection.start,
                        direction: "backwards",
                    })
                    .tryFirst();

                if (!targetBlock) {
                    return selection;
                }

                const toMove = thisBlock.with({
                    end: new vscode.Position(thisBlock.end.line + 1, 0),
                });

                editor.move(
                    this.context.editor.document,
                    textEdit,
                    toMove,
                    targetBlock.start
                );

                return new vscode.Selection(thisBlock.start, thisBlock.start);
            });
        });
    }

    async swapSubjectUp() {
        this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(
                    this.context.editor,
                    selection.start
                );

                const nextBlock = blocks
                    .iterVertically(this.context.editor, {
                        fromPosition: selection.start,
                        direction: "backwards",
                    })
                    .skip(1)
                    .tryFirst();

                if (!nextBlock) {
                    return selection;
                }

                editor.swap(
                    this.context.editor.document,
                    e,
                    thisBlock,
                    nextBlock
                );

                return new vscode.Selection(nextBlock.end, nextBlock.start);
            });
        });
    }

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

    async firstSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterBlocksInCurrentScope(this.context.editor, {
                    fromPosition: selection.start,
                    direction: "backwards",
                })
                .tryLast()
        );
    }

    async lastSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterBlocksInCurrentScope(this.context.editor, {
                    fromPosition: selection.start,
                    direction: "forwards",
                })
                .tryLast()
        );
    }

    async deleteSubject() {
        this.context.editor.edit((e) => {
            for (const selection of this.context.editor.selections) {
                const prevBlock = blocks
                    .iterBlocksInCurrentScope(this.context.editor, {
                        fromPosition: selection.start,
                        direction: "backwards",
                    })
                    .tryFirst();

                if (prevBlock) {
                    e.delete(new vscode.Range(prevBlock.end, selection.end));
                } else {
                    const nextBlock = blocks
                        .iterBlocksInCurrentScope(this.context.editor, {
                            fromPosition: selection.end,
                            direction: "forwards",
                        })
                        .tryFirst();

                    if (nextBlock) {
                        e.delete(
                            new vscode.Range(selection.start, nextBlock.start)
                        );
                    } else {
                        e.delete(selection);
                    }
                }
            }
        });
    }

    async duplicateSubject(): Promise<void> {
        for (const selection of this.context.editor.selections) {
            this.context.editor.edit((e) => {
                blocks.duplicate(this.context.editor.document, e, selection);
            });
        }
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) => {
            const blockPoints = blocks.iterAll(this.context.editor, {
                fromPosition: selection.end,
                direction: "forwards",
            });

            for (const { start } of blockPoints) {
                const charRange = new vscode.Range(
                    start,
                    start.translate({ characterDelta: 1 })
                );

                const char = this.context.editor.document.getText(charRange);

                if (char === target) {
                    return new vscode.Selection(charRange.end, charRange.start);
                }
            }

            return selection;
        });
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) => {
            const blockPoints = blocks.iterAll(this.context.editor, {
                fromPosition: selection.end,
                direction: "forwards",
            });

            for (const { start } of blockPoints) {
                const charRange = new vscode.Range(
                    start,
                    start.translate(undefined, 1)
                );

                const char = this.context.editor.document.getText(charRange);

                if (char === target) {
                    return new vscode.Selection(charRange.end, charRange.start);
                }
            }

            return selection;
        });
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return blocks.iterAll(this.context.editor, {
            fromPosition: this.context.editor.selection.active,
            direction,
        });
    }
}
