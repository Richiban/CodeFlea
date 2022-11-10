import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import ModeManager from "./ModeManager";
import * as modes from "./modes";
import * as editor from "../utils/editor";

export default class NavigateMode extends modes.EditorMode {
    constructor(
        private manager: ModeManager,
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

    async changeTo(newMode: modes.EditorModeType): Promise<modes.EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.manager, this);

            case "EXTEND":
                return new ExtendMode(this.manager, this.subject, this);

            case "NAVIGATE":
                if (newMode.subjectName !== this.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new NavigateMode(
                        this.manager,
                        subjects.createFrom(this.manager, newMode.subjectName)
                    );
                }

                switch (newMode.subjectName) {
                    case "LINE":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "ALL_LINES")
                        );
                    case "WORD":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "SMALL_WORD")
                        );
                    case "SMALL_WORD":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "WORD")
                        );
                    case "ALL_LINES":
                        return new NavigateMode(
                            this.manager,
                            subjects.createFrom(this.manager, "LINE")
                        );
                }

                return this;
        }
    }

    refreshUI(editorManager: ModeManager) {
        editorManager.statusBar.text = `Navigate (${this.subject?.name})`;

        if (editorManager.editor) {
            editorManager.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.UnderlineThin;

            editorManager.editor.options.lineNumbers =
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

        await (cf as any)(...this.lastCommand.args);
    }

    async fixSelection() {
        await this.subject.fixSelection();
    }
}
