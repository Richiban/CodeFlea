import * as blocks from "../utils/blocks";
import * as vscode from "vscode";
import * as lines from "../utils/lines";
import * as words from "../utils/words";
import * as selections from "../utils/selectionsAndRanges";
import * as editor from "../utils/editor";
import * as common from "../common";

export type SubjectType = "WORD" | "LINE" | "SUBWORD" | "ALL_LINES" | "BLOCK";

export type SubjectActions = {
    nextSubjectDown(): Promise<void>;
    nextSubjectUp(): Promise<void>;
    nextSubjectLeft(): Promise<void>;
    nextSubjectRight(): Promise<void>;

    addSubjectDown(): Promise<void>;
    addSubjectUp(): Promise<void>;
    addSubjectLeft(): Promise<void>;
    addSubjectRight(): Promise<void>;

    extendSubjectDown(): Promise<void>;
    extendSubjectUp(): Promise<void>;
    extendSubjectLeft(): Promise<void>;
    extendSubjectRight(): Promise<void>;

    swapSubjectDown(): Promise<void>;
    swapSubjectUp(): Promise<void>;
    swapSubjectLeft(): Promise<void>;
    swapSubjectRight(): Promise<void>;

    nextSubjectMatch(): Promise<void>;
    prevSubjectMatch(): Promise<void>;
    extendNextSubjectMatch(): Promise<void>;
    extendPrevSubjectMatch(): Promise<void>;

    firstSubjectInScope(): Promise<void>;
    lastSubjectInScope(): Promise<void>;

    deleteSubject(): Promise<void>;
    changeSubject(): Promise<void>;
    duplicateSubject(): Promise<void>;

    append(): Promise<void>;
    prepend(): Promise<void>;

    newLineAbove(): Promise<void>;
    newLineBelow(): Promise<void>;

    search(target: common.Char): Promise<void>;
    searchBackwards(target: string): Promise<void>;
};

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

    async append() {
        selections.collapseSelections(this.context.editor, "end");
    }

    async prepend() {
        selections.collapseSelections(this.context.editor, "start");
    }

    async newLineAbove() {
        await vscode.commands.executeCommand("editor.action.insertLineBefore");
    }

    async newLineBelow() {
        await vscode.commands.executeCommand("editor.action.insertLineAfter");
    }

    abstract name: SubjectType;
    abstract fixSelection(): Promise<void>;
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

    async fixSelection() {
        selections.tryMap(this.context.editor, (selection) => {
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
        });

        this.context.editor.setDecorations(
            AllLinesSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async extendSubjectDown() {
        await vscode.commands.executeCommand("editor.action.insertCursorBelow");
    }

    async extendSubjectUp() {
        await vscode.commands.executeCommand("editor.action.insertCursorAbove");
    }

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
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
        this.context.editor.setDecorations(BlockSubject.decorationType, []);
    }

    async fixSelection() {
        selections.tryMap(this.context.editor, (selection) => {
            const startBlock = blocks.getContainingBlock(selection.start);
            const endBlock = blocks.getContainingBlock(selection.end);

            return new vscode.Selection(
                new vscode.Position(endBlock.end.line, endBlock.end.character),
                new vscode.Position(
                    startBlock.start.line,
                    startBlock.start.character
                )
            );
        });

        this.context.editor.setDecorations(
            BlockSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectDown() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("forwards", "same-indentation", from);
    }

    async nextSubjectUp() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("backwards", "same-indentation", from);
    }

    async nextSubjectLeft() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("backwards", "less-indentation", from);
    }

    async nextSubjectRight() {
        const from = this.context.editor?.selection.start;

        blocks.moveToNextBlockStart("forwards", "more-indentation", from);
    }

    async swapSubjectDown() {
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

    async swapSubjectLeft() {
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

    async swapSubjectUp() {
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
            blocks.getFirstLastBlockInScope(selection.start, "backwards")
        );
    }

    async lastSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks.getFirstLastBlockInScope(selection.start, "forwards")
        );
    }

    async deleteSubject() {
        
        
        for (const selection of this.context.editor.selections) {
            const prevBlock = blocks.getNextBlockInScope(
                selection.start,
                "backwards"
            );

            if (prevBlock) {
                this.context.editor.edit((e) => {
                    e.delete(new vscode.Range(prevBlock.end, selection.end));
                });
            } else {
                const nextBlock = blocks.getNextBlockInScope(
                    selection.end,
                    "forwards"
                );

                if (nextBlock) {
                    this.context.editor.edit((e) => {
                        e.delete(
                            new vscode.Range(selection.start, nextBlock.start)
                        );
                    });
                }
            }
        }
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

    async searchBackwards(target: common.Char) {
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

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    async deleteSubject() {
        await vscode.commands.executeCommand("editor.action.deleteLines");
    }

    async duplicateSubject(): Promise<void> {
        for (const selection of this.context.editor.selections) {
            await this.context.editor.edit((e) => {
                lines.duplicate(this.context.editor.document, e, selection);
            });
        }
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

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
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
        selections.tryMap(this.context.editor, (selection) => {
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
        });
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) => {
            if (!selection.isSingleLine) {
                return selection;
            }

            return lines.getNextLineOfChangeOfIndentation(
                "greaterThan",
                "forwards",
                this.context.editor.document,
                this.context.editor.document.lineAt(selection.start.line)
            )?.range;
        });
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
        selections.tryMap(this.context.editor, (selection) => {
            for (const line of lines
                .iterLines(
                    this.context.editor.document,
                    selection.start.line,
                    "forwards"
                )
                .skip(1)) {
                const char = this.context.editor.document.getText(line.range)[
                    line.firstNonWhitespaceCharacterIndex
                ];

                if (char === target) {
                    return line.range;
                }
            }
        });
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) => {
            for (const line of lines
                .iterLines(
                    this.context.editor.document,
                    selection.start.line,
                    "backwards"
                )
                .skip(1)) {
                const char = this.context.editor.document.getText(line.range)[
                    line.firstNonWhitespaceCharacterIndex
                ];

                if (char === target) {
                    return line.range;
                }
            }
        });
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

export class SubWordSubject extends Subject {
    readonly name = "SUBWORD";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "2px dotted #964d4d;",
        }
    );

    async nextSubjectDown() {
        await vscode.commands.executeCommand("cursorDown");
    }

    async nextSubjectUp() {
        await vscode.commands.executeCommand("cursorUp");
    }

    async nextSubjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            words
                .iterSubwords(
                    this.context.editor.document,
                    selection.start,
                    "backwards"
                )
                .tryFirst()
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            words
                .iterSubwords(
                    this.context.editor.document,
                    selection.end,
                    "forwards"
                )
                .tryFirst()
        );
    }

    async firstSubjectInScope() {
        await vscode.commands.executeCommand("cursorHome");
    }

    async lastSubjectInScope() {
        await vscode.commands.executeCommand("cursorEnd");
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.searchSubword(
                this.context.editor.document,
                selection.end,
                target,
                "forwards"
            )
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.searchSubword(
                this.context.editor.document,
                selection.start,
                target,
                "backwards"
            )
        );
    }

    async fixSelection() {
        if (!this.context.editor) {
            return;
        }

        selections.tryMap(this.context.editor, (selection) => {
            const wordRange = words.expandSelectionToSubwords(
                this.context.editor.document,
                selection
            );

            return wordRange ?? selection;
        });

        this.context.editor.setDecorations(
            SubWordSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    clearUI(): void {
        this.context.editor.setDecorations(SubWordSubject.decorationType, []);
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

    async changeSubject() {
        await vscode.commands.executeCommand("deleteLeft");
    }

    clearUI(): void {
        this.context.editor.setDecorations(WordSubject.decorationType, []);
    }

    async fixSelection() {
        if (!this.context.editor) {
            return;
        }

        selections.tryMap(this.context.editor, (selection) =>
            words.expandSelectionToWords(
                this.context.editor.document,
                selection
            )
        );

        this.context.editor.setDecorations(
            WordSubject.decorationType,
            this.context.editor.selections
        );

        editor.scrollToReveal(
            this.context.editor.selection.start,
            this.context.editor.selection.end
        );
    }

    async nextSubjectDown() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWordUpDown(
                this.context.editor.document,
                selection.active,
                "down"
            )
        );
    }

    async nextSubjectUp() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWordUpDown(
                this.context.editor.document,
                selection.active,
                "up"
            )
        );
    }

    async nextSubjectLeft() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWord(
                this.context.editor.document,
                selection.start,
                "backwards"
            )
        );
    }

    async nextSubjectRight() {
        selections.tryMap(this.context.editor, (selection) =>
            words.nextWord(
                this.context.editor.document,
                selection.end,
                "forwards"
            )
        );
    }

    async swapSubjectLeft() {
        await words.swapWordsWithNeighbors(this.context.editor, "backwards");
    }

    async swapSubjectRight() {
        await words.swapWordsWithNeighbors(this.context.editor, "forwards");
    }

    async firstSubjectInScope() {
        if (true) {
            await vscode.commands.executeCommand("cursorHome");
        }
    }

    async lastSubjectInScope(): Promise<void> {
        await vscode.commands.executeCommand("cursorEnd");
    }

    async deleteSubject() {
        for (const selection of this.context.editor.selections) {
            await this.context.editor.edit((e) => {
                words.deleteWord(this.context.editor.document, e, selection);
            });
        }
    }

    async duplicateSubject(): Promise<void> {
        for (const selection of this.context.editor.selections) {
            await this.context.editor.edit((e) => {
                words.duplicateWord(this.context.editor.document, e, selection);
            });
        }
    }

    async search(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.search(this.context.editor, selection.end, target, "forwards")
        );
    }

    async searchBackwards(target: common.Char) {
        selections.tryMap(this.context.editor, (selection) =>
            words.search(
                this.context.editor,
                selection.start,
                target,
                "backwards"
            )
        );
    }

    iterAll(direction: common.Direction): common.Linqish<vscode.Range> {
        return words.iterWords(
            this.context.editor.document,
            this.context.editor.selection.start,
            direction
        );
    }
}
