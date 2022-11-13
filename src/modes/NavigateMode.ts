import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import * as modes from "./modes";
import * as editor from "../utils/editor";
import * as selections from "../utils/selections";
import * as common from "../common";

export default class NavigateMode extends modes.EditorMode {
    private commandMultiplier: number = 0;

    constructor(
        private readonly context: common.ExtensionContext,
        public readonly subject: subjects.Subject
    ) {
        super();
    }

    equals(previousMode: modes.EditorMode): boolean {
        return (
            previousMode instanceof NavigateMode &&
            previousMode.subject === this.subject
        );
    }

    copy(): modes.EditorMode {
        return new NavigateMode(this.context, this.subject);
    }

    async changeTo(newMode: modes.EditorModeType): Promise<modes.EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, this);

            case "EXTEND":
                return new ExtendMode(this.context, this.subject, this);

            case "NAVIGATE":
                if (editor) {
                    selections.collapseSelections(this.context.editor);
                }

                if (newMode.subjectName !== this.subject.name) {
                    return new NavigateMode(
                        this.context,
                        subjects.createFrom(this.context, newMode.subjectName)
                    );
                }

                switch (newMode.subjectName) {
                    case "LINE":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "ALL_LINES")
                        );
                    case "WORD":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "SMALL_WORD")
                        );
                    case "SMALL_WORD":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "WORD")
                        );
                    case "ALL_LINES":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "LINE")
                        );
                }

                return this;
        }
    }

    clearUI() {
        this.subject.clearUI();
    }

    refreshUI() {
        this.context.statusBar.text = `Navigate (${this.subject?.name})`;

        if (this.commandMultiplier > 1) {
            this.context.statusBar.text += ` x${this.commandMultiplier}`;
        }

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

        this.subject?.fixSelection();
    }

    async executeSubjectCommand(command: keyof subjects.SubjectActions) {
        if (this.subject[command].length > 1) {
            throw new Error(
                "Functions with multiple arguments are not supported"
            );
        }

        const args: [] | [string] = [];

        if (this.subject[command].length === 1) {
            const input = await editor.inputBoxChar(command);

            (args as string[]).push(input);
        }

        this.lastCommand = { commandName: command, args: args };

        await (this.subject[command] as any)(...args);

        let refreshNeeded = false;

        while (this.commandMultiplier > 1) {
            await this.repeatSubjectCommand();
            this.commandMultiplier--;
            refreshNeeded = true;
        }

        this.commandMultiplier = 0;

        if (refreshNeeded) {
            this.refreshUI();
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
        const parsed = parseInt(typed.text, 10);

        if (isNaN(parsed)) {
            vscode.commands.executeCommand("default:type", typed);
            return this;
        }

        this.commandMultiplier = this.commandMultiplier * 10 + parsed;

        return this;
    }

    async fixSelection() {
        await this.subject.fixSelection();

        if (this.context.editor) {
            editor.scrollToReveal(
                this.context.editor.selection.start,
                this.context.editor.selection.end
            );
        }
    }

    async dispose() {
        this.subject.dispose();
    }
}
