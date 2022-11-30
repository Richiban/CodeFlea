import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import * as modes from "./modes";
import * as editor from "../utils/editor";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { NumHandler } from "../handlers/NumHandler";

export default class NavigateMode extends modes.EditorMode {
    constructor(
        private readonly context: common.ExtensionContext,
        public readonly subject: subjects.Subject,
        private readonly numHandler: NumHandler
    ) {
        super();
    }

    equals(previousMode: modes.EditorMode): boolean {
        return (
            previousMode instanceof NavigateMode &&
            previousMode.subject === this.subject
        );
    }

    with(
        args: Partial<{
            context: common.ExtensionContext;
            subject: subjects.Subject;
            numHandler: NumHandler;
        }>
    ) {
        return new NavigateMode(
            args.context ?? this.context,
            args.subject ?? this.subject,
            args.numHandler ?? this.numHandler
        );
    }

    async changeTo(newMode: modes.EditorModeType): Promise<modes.EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, this);

            case "EXTEND":
                return new ExtendMode(this.context, this, this.numHandler);

            case "NAVIGATE":
                if (editor) {
                    selections.collapseSelections(this.context.editor);
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
                    case "LINE":
                        return this.with({
                            subject: subjects.createFrom(
                                this.context,
                                "ALL_LINES"
                            ),
                        });
                    case "WORD":
                        return this.with({
                            subject: subjects.createFrom(
                                this.context,
                                "SUBWORD"
                            ),
                        });
                    case "SUBWORD":
                        return this.with({
                            subject: subjects.createFrom(this.context, "WORD"),
                        });
                    case "ALL_LINES":
                        return this.with({
                            subject: subjects.createFrom(this.context, "LINE"),
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
        this.numHandler.clear();
    }

    refreshUI() {
        this.context.statusBar.text = `Navigate (${this.subject?.name})`;

        if (this.context.editor) {
            this.context.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.UnderlineThin;

            this.context.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "NAVIGATE"
        );

        this.fixSelection();
    }

    async executeSubjectCommand(command: keyof subjects.SubjectActions) {
        if (this.subject[command].length > 1) {
            throw new Error(
                "Functions with multiple arguments are not supported"
            );
        }

        let args: [] | [string] = [];

        if (this.subject[command].length === 1) {
            const input = await editor.inputBoxChar(command);
            args = [input];
        }

        this.lastCommand = { commandName: command, args: args };

        const { needsUiRefresh: refreshNeeded } =
            await this.numHandler.handleCommandExecution(async () => {
                await (this.subject[command] as any)(...args);
            });

        if (refreshNeeded) {
            this.refreshUI();
        } else {
            this.fixSelection();
        }
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

        this.numHandler.setRanges(
            this.subject.iterAll("forwards"),
            this.subject.iterAll("backwards")
        );
    }

    async dispose() {
        this.subject.dispose();
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
}
