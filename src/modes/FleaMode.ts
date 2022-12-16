import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import InsertMode from "./InsertMode";
import ExtendMode from "./ExtendMode";
import * as modes from "./modes";
import * as editor from "../utils/editor";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { NumHandler } from "../handlers/NumHandler";
import SubjectBase from "../subjects/SubjectBase";
import { SubjectAction } from "../subjects/SubjectActions";
import JumpInterface from "../handlers/JumpInterface";

export default class FleaMode extends modes.EditorMode {
    private lastCommand:
        | { commandName: SubjectAction; args: string[] }
        | undefined;

    constructor(
        private readonly context: common.ExtensionContext,
        public readonly subject: SubjectBase,
        private readonly numHandler: NumHandler
    ) {
        super();
    }

    equals(previousMode: modes.EditorMode): boolean {
        return (
            previousMode instanceof FleaMode &&
            previousMode.subject === this.subject
        );
    }

    with(
        args: Partial<{
            context: common.ExtensionContext;
            subject: SubjectBase;
            numHandler: NumHandler;
        }>
    ) {
        return new FleaMode(
            args.context ?? this.context,
            args.subject ?? this.subject,
            args.numHandler ?? this.numHandler
        );
    }

    async changeTo(
        newMode: modes.EditorModeChangeRequest
    ): Promise<modes.EditorMode> {
        switch (newMode.kind) {
            case "INSERT":
                return new InsertMode(this.context, this);

            case "EXTEND":
                return new ExtendMode(this.context, this, this.numHandler);

            case "FLEA":
                if (editor) {
                    selections.collapseSelections(this.context.editor, "start");
                }

                if (newMode.subjectName !== this.subject.name) {
                    return this.with({
                        subject: subjects.createFrom(
                            this.context,
                            newMode.subjectName
                        ),
                    });
                }

                switch (newMode.subjectName) {
                    case "WORD":
                        return this.with({
                            subject: subjects.createFrom(
                                this.context,
                                "INTERWORD"
                            ),
                        });
                    case "INTERWORD":
                        return this.with({
                            subject: subjects.createFrom(this.context, "WORD"),
                        });
                }

                return this;
        }
    }

    changeNumHandler(): modes.EditorMode {
        return this.with({ numHandler: this.numHandler.change() });
    }

    clearUI() {
        this.subject.clearUI();
        this.numHandler.clearUI();
    }

    setUI() {
        this.context.statusBar.text = `Flea mode (${this.subject?.name})`;

        if (this.context.editor) {
            this.context.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.UnderlineThin;
        }

        vscode.commands.executeCommand("setContext", "codeFlea.mode", "FLEA");

        this.numHandler.setUI(this.subject);

        this.context.editor.setDecorations(
            this.subject.decorationType,
            this.context.editor.selections
        );

        this.context.editor.revealRange(this.context.editor.selection);
    }

    async executeSubjectCommand(command: SubjectAction): Promise<void> {
        if (this.subject[command].length > 1) {
            throw new Error(
                "Functions with multiple arguments are not supported"
            );
        }

        let args: [] | [string] = [];

        if (this.subject[command].length === 1) {
            const input = await editor.inputBoxChar(command);

            if (input === undefined) {
                return;
            }

            args = [input];
        }

        this.lastCommand = { commandName: command, args: args };

        await this.numHandler.handleCommandExecution(async () => {
            await (this.subject[command] as any)(...args);
        });

        this.setUI();
    }

    async repeatSubjectCommand() {
        if (!this.lastCommand) {
            return;
        }

        const cf = this.subject[this.lastCommand.commandName];

        if (cf.length > 1) {
            throw new Error(
                "Functions with multiple arguments are not supported"
            );
        }

        await (this.subject[this.lastCommand.commandName] as any)(
            ...this.lastCommand.args
        );
    }

    onCharTyped(typed: { text: string }): modes.EditorMode {
        const parsed = this.tryParseNumber(typed.text);

        if (!parsed) {
            vscode.commands.executeCommand("default:type", typed);
            return this;
        }

        this.numHandler.handleNumKey(parsed.number, parsed.shifted);

        return this;
    }

    async fixSelection() {
        await this.subject.fixSelection();
    }

    private tryParseNumber(
        text: string
    ): { number: number; shifted: boolean } | undefined {
        if (text.length !== 1) {
            return undefined;
        }

        const regularNums = "0123456789";
        const shiftedNums = ")!@#$%^&*(";

        const regularIndex = regularNums.indexOf(text);
        const shiftedIndex = shiftedNums.indexOf(text);

        if (regularIndex !== -1) {
            return { number: regularIndex, shifted: false };
        }

        if (shiftedIndex !== -1) {
            return { number: shiftedIndex, shifted: true };
        }
    }

    async jump(): Promise<void> {
        const jumpLocations = this.subject
            .iterAll(
                common.IterationDirection.alternate,
                this.context.editor.visibleRanges[0]
            )
            .map((range) => range.start);

        const jumpInterface = new JumpInterface(this.context);

        const jumpPosition = await jumpInterface.jump({
            kind: this.subject.jumpPhaseType,
            locations: jumpLocations,
        });

        if (jumpPosition) {
            this.context.editor.selection =
                selections.positionToSelection(jumpPosition);

            await this.fixSelection();
        }
    }
}
