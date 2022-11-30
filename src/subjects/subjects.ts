import * as blocks from "../utils/blocks";
import * as vscode from "vscode";
import * as lines from "../utils/lines";
import * as words from "../utils/words";
import * as selections from "../utils/selectionsAndRanges";
import * as editor from "../utils/editor";
import * as common from "../common";
import { threadId } from "worker_threads";

export type SubjectType = "WORD" | "LINE" | "SUBWORD" | "ALL_LINES" | "BLOCK";

export type SubjectActions = {
    nextSubjectDown(): void;
    nextSubjectUp(): void;
    nextSubjectLeft(): void;
    nextSubjectRight(): void;

    addSubjectDown(): void;
    addSubjectUp(): void;
    addSubjectLeft(): void;
    addSubjectRight(): void;

    extendSubjectDown(): void;
    extendSubjectUp(): void;
    extendSubjectLeft(): void;
    extendSubjectRight(): void;

    swapSubjectDown(): void;
    swapSubjectUp(): void;
    swapSubjectLeft(): void;
    swapSubjectRight(): void;

    nextSubjectMatch(): void;
    prevSubjectMatch(): void;
    extendNextSubjectMatch(): void;
    extendPrevSubjectMatch(): void;

    firstSubjectInScope(): void;
    lastSubjectInScope(): void;

    deleteSubject(): void;
    changeSubject(): void;
    duplicateSubject(): void;

    append(): void;
    prepend(): void;

    newLineAbove(): void;
    newLineBelow(): void;

    search(target: common.Char): void;
    searchBackwards(target: string): void;
};

export abstract class Subject implements SubjectActions, vscode.Disposable {
    constructor(protected context: common.ExtensionContext) {}

    dispose() {}

    nextSubjectDown() {}
    nextSubjectUp() {}
    nextSubjectLeft() {}
    nextSubjectRight() {}
    addSubjectDown() {}
    addSubjectUp() {}
    addSubjectLeft() {}
    addSubjectRight() {}

    extendSubjectUp() {
        // TODO: restore this
        // const existingSelections = this.context.editor.selections;
        // await this.nextSubjectUp();
        // this.context.editor.selections =
        //     this.context.editor.selections.concat(existingSelections);
    }

    extendSubjectDown() {
        // TODO: restore this
        // const existingSelections = this.context.editor.selections;
        // await this.nextSubjectDown();
        // this.context.editor.selections =
        //     this.context.editor.selections.concat(existingSelections);
    }

    extendSubjectLeft() {
        // TODO: restore this
        // const existingSelections = this.context.editor.selections;
        // await this.nextSubjectLeft();
        // this.context.editor.selections =
        //     this.context.editor.selections.concat(existingSelections);
    }

    extendSubjectRight() {
        // TODO: restore this
        // const existingSelections = this.context.editor.selections;
        // await this.nextSubjectRight();
        // this.context.editor.selections =
        //     this.context.editor.selections.concat(existingSelections);
    }

    swapSubjectDown() {}
    swapSubjectUp() {}
    swapSubjectLeft() {}
    swapSubjectRight() {}
    deleteSubject() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "deleteLeft",
        });
    }

    duplicateSubject() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.duplicateSelection",
        });
    }

    changeSubject() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "deleteLeft",
        });
    }
    firstSubjectInScope() {}
    lastSubjectInScope() {}
    search(target: string) {}
    searchBackwards(target: string) {}

    nextSubjectMatch() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.moveSelectionToNextFindMatch",
        });
    }

    prevSubjectMatch() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.moveSelectionToPreviousFindMatch",
        });
    }

    extendPrevSubjectMatch() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.addSelectionToPreviousFindMatch",
        });
    }

    extendNextSubjectMatch() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.addSelectionToNextFindMatch",
        });
    }

    append() {
        selections.collapseSelections(this.context.editor, "end");
    }

    prepend() {
        selections.collapseSelections(this.context.editor, "start");
    }

    newLineAbove() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.insertLineBefore",
        });
    }

    newLineBelow() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.insertLineAfter",
        });
    }

    abstract name: SubjectType;
    abstract fixSelection(): void;
    abstract clearUI(): void;

    equals(other: Subject) {
        return this.name === other.name;
    }

    abstract iterAll(direction: common.Direction): common.Linqish<vscode.Range>;
}

export function createFrom(
    context: common.ExtensionContext,
    subjectName: SubjectType
): Subject {
    switch (subjectName) {
        case "LINE":
            return new LineSubject(context);
        case "WORD":
            return new WordSubject(context);
        case "ALL_LINES":
            return new AllLinesSubject(context);
        case "SUBWORD":
            return new SubWordSubject(context);
        case "BLOCK":
            return new BlockSubject(context);
    }
}
export class AllLinesSubject extends Subject {
    readonly name = "ALL_LINES";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px dashed #8feb34;",
        }
    );

    clearUI() {
        this.context.editor.setDecorations(AllLinesSubject.decorationType, []);
    }

    fixSelection() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: AllLinesSubject.decorationType,
            mapper: (selection) => {
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
            },
        });
    }

    nextSubjectUp() {
        this.context.dispatch({ kind: "vscodeCommand", command: "cursorUp" });
    }

    nextSubjectDown() {
        this.context.dispatch({ kind: "vscodeCommand", command: "cursorDown" });
    }

    extendSubjectDown() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.insertCursorBelow",
        });
    }

    extendSubjectUp() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.insertCursorAbove",
        });
    }

    changeSubject() {
        this.context.dispatch({ kind: "vscodeCommand", command: "deleteLeft" });
    }

    deleteSubject() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.deleteLines",
        });
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return lines
            .iterLines(
                this.context.editor.document,
                this.context.editor.selection.start.line,
                direction
            )
            .map((line) => line.range);
    }
}

export class BlockSubject extends Subject {
    readonly name = "BLOCK";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #aba246;",
        }
    );

    clearUI() {
        this.context.dispatch({
            kind: "clearEditorDecorations",
            decorationType: BlockSubject.decorationType,
        });
    }

    fixSelection() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) => {
                const startBlock = blocks.getContainingBlock(selection.start);
                const endBlock = blocks.getContainingBlock(selection.end);

                return new vscode.Selection(
                    new vscode.Position(
                        endBlock.end.line,
                        endBlock.end.character
                    ),
                    new vscode.Position(
                        startBlock.start.line,
                        startBlock.start.character
                    )
                );
            },
        });
    }

    nextSubjectDown() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) =>
                blocks.getNextBlockInScope(selection.start, "forwards"),
        });
    }

    nextSubjectUp() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) =>
                blocks.getNextBlockInScope(selection.start, "backwards"),
        });
    }

    nextSubjectLeft() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) =>
                blocks.getNextBlockStart(
                    "backwards",
                    "less-indentation",
                    selection.start
                ),
        });
    }

    nextSubjectRight() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) =>
                blocks.getNextBlockStart(
                    "forwards",
                    "more-indentation",
                    selection.end
                ),
        });
    }

    swapSubjectDown() {
        this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const nextBlock = blocks.getNextBlockInScope(
                    selection.end,
                    "forwards"
                );

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

    swapSubjectLeft() {
        this.context.editor.edit((textEdit) => {
            selections.tryMap(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const targetBlock = blocks
                    .iterBlockBoundaries({
                        fromPosition: selection.start,
                        direction: "backwards",
                        indentationLevel: "less-indentation",
                    })
                    .filter((b) => b.kind === "block-start")
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
                    targetBlock.point
                );

                //return selection;
                return new vscode.Selection(thisBlock.start, thisBlock.start);
            });
        });
    }

    swapSubjectUp() {
        this.context.editor.edit((e) => {
            selections.tryMap(this.context.editor, (selection) => {
                const thisBlock = blocks.getContainingBlock(selection.start);

                const nextBlock = blocks.getNextBlockInScope(
                    selection.start,
                    "backwards"
                );

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

    extendSubjectUp() {
        const existingSelections = this.context.editor.selections;

        // TODO restore this
        //await this.nextSubjectUp();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    extendSubjectDown() {
        const existingSelections = this.context.editor.selections;

        // TODO restore this
        //await this.nextSubjectDown();

        this.context.editor.selections =
            this.context.editor.selections.concat(existingSelections);
    }

    firstSubjectInScope() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) =>
                blocks.getFirstLastBlockInScope(selection.start, "backwards"),
        });
    }

    lastSubjectInScope() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: BlockSubject.decorationType,
            mapper: (selection) =>
                blocks.getFirstLastBlockInScope(selection.start, "forwards"),
        });
    }

    deleteSubject() {
        this.context.dispatch({
            kind: "customEditPerSelection",
            edit: (edit, selection) => {
                const prevBlock = blocks.getNextBlockInScope(
                    selection.start,
                    "backwards"
                );

                if (prevBlock) {
                    edit.delete(new vscode.Range(prevBlock.end, selection.end));
                } else {
                    const nextBlock = blocks.getNextBlockInScope(
                        selection.end,
                        "forwards"
                    );

                    if (nextBlock) {
                        edit.delete(
                            new vscode.Range(selection.start, nextBlock.start)
                        );
                    }
                }
            },
        });
    }

    duplicateSubject() {
        for (const selection of this.context.editor.selections) {
            this.context.editor.edit((e) => {
                blocks.duplicate(this.context.editor.document, e, selection);
            });
        }
    }

    search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) => {
            const blockPoints = new common.Linqish(
                blocks.iterBlockBoundaries({
                    fromPosition: selection.end,
                })
            ).filter(({ kind }) => kind === "block-start");

            for (const { point } of blockPoints) {
                const charRange = new vscode.Range(
                    point,
                    point.translate(undefined, 1)
                );

                const char = this.context.editor.document.getText(charRange);

                if (char === target) {
                    return new vscode.Selection(charRange.end, charRange.start);
                }
            }

            return selection;
        });
    }

    searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) => {
            const blockPoints = blocks
                .iterBlockBoundaries({
                    fromPosition: selection.end,
                    direction: "backwards",
                })
                .filter(({ kind }) => kind === "block-start");

            for (const { point } of blockPoints) {
                const charRange = new vscode.Range(
                    point,
                    point.translate(undefined, 1)
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
        return blocks
            .iterBlockBoundaries({
                fromPosition: this.context.editor.selection.active,
                direction,
            })
            .filterMap(({ kind, point }) => {
                if (kind === "block-start") {
                    return selections.pointToRange(point);
                }
            });
    }
}

export class LineSubject extends Subject {
    readonly name = "LINE";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #8feb34;",
        }
    );

    changeSubject() {
        this.context.dispatch({ kind: "vscodeCommand", command: "deleteLeft" });
    }

    deleteSubject() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.deleteLines",
        });
    }

    duplicateSubject() {
        this.context.dispatch({
            kind: "customEditPerSelection",
            edit: (e, selection) => {
                lines.duplicate(this.context.editor.document, e, selection);
            },
        });
    }

    clearUI() {
        this.context.dispatch({
            kind: "clearEditorDecorations",
            decorationType: LineSubject.decorationType,
        });
    }

    fixSelection() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) => {
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
            },
        });
    }

    nextSubjectDown() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) =>
                lines.getNextSignificantLine(
                    this.context.editor.document,
                    selection.end,
                    "forwards"
                )?.range,
        });
    }

    nextSubjectUp() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) =>
                lines.getNextSignificantLine(
                    this.context.editor.document,
                    selection.end,
                    "backwards"
                )?.range,
        });
    }

    nextSubjectLeft() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) => {
                if (!selection.isSingleLine) {
                    return selection;
                }

                const nextLine = lines.getNextLineOfChangeOfIndentation(
                    "lessThan",
                    "backwards",
                    this.context.editor.document,
                    this.context.editor.document.lineAt(selection.start.line)
                );

                if (nextLine) {
                    return nextLine.range;
                }
            },
        });
    }

    nextSubjectRight() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) => {
                if (!selection.isSingleLine) {
                    return selection;
                }

                return lines.getNextLineOfChangeOfIndentation(
                    "greaterThan",
                    "forwards",
                    this.context.editor.document,
                    this.context.editor.document.lineAt(selection.start.line)
                )?.range;
            },
        });
    }

    swapSubjectLeft() {
        // TODO: restore this
        // const newSelections: vscode.Selection[] = [];
        // await this.context.editor.edit((e) => {
        //     for (const selection of this.context.editor.selections) {
        //         const newSelection = lines.swapLineSideways(
        //             this.context.editor.document,
        //             selection.start,
        //             e,
        //             "left"
        //         );
        //         if (newSelection) {
        //             newSelections.push(
        //                 new vscode.Selection(
        //                     newSelection.start,
        //                     newSelection.end
        //                 )
        //             );
        //         }
        //     }
        // });
        // this.context.editor.selections = newSelections;
    }

    swapSubjectRight() {
        // TODO: restore this
        // const newSelections: vscode.Selection[] = [];
        // await this.context.editor.edit((e) => {
        //     for (const selection of this.context.editor.selections) {
        //         const newSelection = lines.swapLineSideways(
        //             this.context.editor.document,
        //             selection.start,
        //             e,
        //             "right"
        //         );
        //         if (newSelection) {
        //             newSelections.push(
        //                 new vscode.Selection(
        //                     newSelection.start,
        //                     newSelection.end
        //                 )
        //             );
        //         }
        //     }
        // });
        // this.context.editor.selections = newSelections;
    }

    swapSubjectDown() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.moveLinesDownAction",
        });
    }

    swapSubjectUp() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "editor.action.moveLinesUpAction",
        });
    }

    search(target: common.Char) {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) => {
                return lines
                    .iterLines(
                        this.context.editor.document,
                        selection.start.line,
                        "forwards"
                    )
                    .skip(1)
                    .filterMap((line) => {
                        const char = this.context.editor.document.getText(
                            line.range
                        )[line.firstNonWhitespaceCharacterIndex];

                        if (char === target) {
                            return line.range;
                        }
                    })
                    .tryFirst();
            },
        });
    }

    searchBackwards(target: common.Char) {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: LineSubject.decorationType,
            mapper: (selection) => {
                return lines
                    .iterLines(
                        this.context.editor.document,
                        selection.start.line,
                        "backwards"
                    )
                    .skip(1)
                    .filterMap((line) => {
                        const char = this.context.editor.document.getText(
                            line.range
                        )[line.firstNonWhitespaceCharacterIndex];

                        if (char === target) {
                            return line.range;
                        }
                    })
                    .tryFirst();
            },
        });
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return lines
            .iterLines(
                this.context.editor.document,
                this.context.editor.selection.start.line,
                direction
            )
            .filterMap((line) =>
                lines.lineIsSignificant(line) ? line.range : undefined
            );
    }
}

export class SubWordSubject extends Subject {
    readonly name = "SUBWORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "2px dotted #964d4d;",
        }
    );

    nextSubjectDown() {
        this.context.dispatch({ kind: "vscodeCommand", command: "cursorDown" });
    }

    nextSubjectUp() {
        this.context.dispatch({ kind: "vscodeCommand", command: "cursorUp" });
    }

    nextSubjectLeft() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: SubWordSubject.decorationType,
            mapper: (selection) =>
                words
                    .iterSubwords(
                        this.context.editor.document,
                        selection.start,
                        "backwards"
                    )
                    .tryFirst(),
        });
    }

    nextSubjectRight() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: SubWordSubject.decorationType,
            mapper: (selection) =>
                words
                    .iterSubwords(
                        this.context.editor.document,
                        selection.start,
                        "forwards"
                    )
                    .tryFirst(),
        });
    }

    firstSubjectInScope() {
        this.context.dispatch({ kind: "vscodeCommand", command: "cursorHome" });
    }

    lastSubjectInScope() {
        this.context.dispatch({ kind: "vscodeCommand", command: "cursorEnd" });
    }

    search(target: common.Char) {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: SubWordSubject.decorationType,
            mapper: (selection) =>
                words.searchSubword(
                    this.context.editor.document,
                    selection.end,
                    target,
                    "forwards"
                ),
        });
    }

    searchBackwards(target: common.Char) {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: SubWordSubject.decorationType,
            mapper: (selection) =>
                words.searchSubword(
                    this.context.editor.document,
                    selection.start,
                    target,
                    "backwards"
                ),
        });
    }

    fixSelection() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: SubWordSubject.decorationType,
            mapper: (selection) => {
                const wordRange = words.expandSelectionToSubwords(
                    this.context.editor.document,
                    selection
                );

                return wordRange ?? selection;
            },
        });
    }

    clearUI(): void {
        this.context.dispatch({
            kind: "clearEditorDecorations",
            decorationType: SubWordSubject.decorationType,
        });
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return words.iterSubwords(
            this.context.editor.document,
            this.context.editor.selection.start,
            direction
        );
    }
}

export class WordSubject extends Subject {
    readonly name = "WORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #964d4d;",
            cursor: "color: rgba(0, 255, 0, 0);",
        }
    );

    public static quickNumberDecoration =
        vscode.window.createTextEditorDecorationType({});

    changeSubject() {
        this.context.dispatch({ kind: "vscodeCommand", command: "deleteLeft" });
    }

    clearUI(): void {
        this.context.dispatch({
            kind: "clearEditorDecorations",
            decorationType: WordSubject.decorationType,
        });
    }

    fixSelection() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.expandRangeToWords(
                    this.context.editor.document,
                    selection
                ),
        });
    }

    nextSubjectDown() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.nextWordUpDown(
                    this.context.editor.document,
                    selection.active,
                    "down"
                ),
        });
    }

    nextSubjectUp() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.nextWordUpDown(
                    this.context.editor.document,
                    selection.active,
                    "up"
                ),
        });
    }

    nextSubjectLeft() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.nextWord(
                    this.context.editor.document,
                    selection.start,
                    "backwards"
                ),
        });
    }

    nextSubjectRight() {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.nextWord(
                    this.context.editor.document,
                    selection.end,
                    "forwards"
                ),
        });
    }

    swapSubjectLeft() {
        // TODO: restore this
        //await words.swapWordsWithNeighbors(this.context.editor, "backwards");
    }

    swapSubjectRight() {
        // TODO: restore this
        //await words.swapWordsWithNeighbors(this.context.editor, "forwards");
    }

    firstSubjectInScope() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "cursorHome",
        });
    }

    lastSubjectInScope() {
        this.context.dispatch({
            kind: "vscodeCommand",
            command: "cursorEnd",
        });
    }

    deleteSubject() {
        this.context.dispatch({
            kind: "customEditPerSelection",
            edit: (textEdit, selection) => {
                words.deleteWord(
                    this.context.editor.document,
                    textEdit,
                    selection
                );
            },
        });
    }

    duplicateSubject() {
        this.context.dispatch({
            kind: "customEditPerSelection",
            edit: (textEdit, selection) =>
                words.duplicateWord(
                    this.context.editor.document,
                    textEdit,
                    selection
                ),
        });
    }

    search(target: common.Char) {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.search(
                    this.context.editor,
                    selection.end,
                    target,
                    "forwards"
                ),
        });
    }

    searchBackwards(target: common.Char) {
        this.context.dispatch({
            kind: "mapEditorSelections",
            decorationType: WordSubject.decorationType,
            mapper: (selection) =>
                words.search(
                    this.context.editor,
                    selection.start,
                    target,
                    "backwards"
                ),
        });
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return words.iterWords(
            this.context.editor.document,
            this.context.editor.selection.start,
            direction
        );
    }
}
