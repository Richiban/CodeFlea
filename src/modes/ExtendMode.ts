import * as common from "../common";
import Linqish from "../utils/Linqish";
import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import EditMode from "./EditMode";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import NavigateMode from "./NavigateMode";
import { NumHandler } from "../handlers/NumHandler";
import { SubjectActions } from "../subjects/SubjectActions";

export default class ExtendMode extends EditorMode {
    private readonly wrappedMode: NavigateMode;

    constructor(
        private readonly context: common.ExtensionContext,
        previousMode: NavigateMode,
        private readonly numHandler: NumHandler
    ) {
        super();

        this.wrappedMode = previousMode;
    }

    async fixSelection() {
        await this.wrappedMode.fixSelection();
    }

    async changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode> {
        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, this.wrappedMode);
            case "NAVIGATE":
                return this.wrappedMode;
            case "EXTEND":
                if (newMode.subjectName !== this.wrappedMode.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new NavigateMode(
                        this.context,
                        subjects.createFrom(this.context, newMode.subjectName),
                        this.numHandler
                    );
                }

                switch (newMode.subjectName) {
                    case "WORD":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "SUBWORD"),
                            this.numHandler
                        );
                    case "SUBWORD":
                        return new NavigateMode(
                            this.context,
                            subjects.createFrom(this.context, "WORD"),
                            this.numHandler
                        );
                }

                return this;
        }
    }

    changeNumHandler(): EditorMode {
        return this.with({ numHandler: this.numHandler.change() });
    }

    with(
        args: Partial<{
            context: common.ExtensionContext;
            wrappedMode: NavigateMode;
            numHandler: NumHandler;
        }>
    ) {
        return new ExtendMode(
            args.context ?? this.context,
            args.wrappedMode ?? this.wrappedMode,
            args.numHandler ?? this.numHandler
        );
    }

    clearUI(): void {
        this.wrappedMode.clearUI();
    }

    async setUI() {
        this.context.statusBar.text = `Extend (${this.wrappedMode.subject?.name})`;

        if (this.context.editor) {
            this.context.editor.options.cursorStyle =
                vscode.TextEditorCursorStyle.BlockOutline;

            this.context.editor.options.lineNumbers =
                vscode.TextEditorLineNumbersStyle.Relative;
        }

        await vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "EXTEND"
        );

        this.wrappedMode.fixSelection();
    }

    async executeSubjectCommand(command: keyof SubjectActions): Promise<void> {
        const existingSelections = new Linqish(this.context.editor.selections);

        await this.wrappedMode.executeSubjectCommand(command);

        const newSelections = existingSelections
            .zipWith(this.context.editor.selections)
            .map(([a, b]) => {
                const newRange = a.union(b);
                return new vscode.Selection(newRange.end, newRange.start);
            })
            .toArray();

        this.context.editor.selections = newSelections;
    }

    async repeatSubjectCommand() {}

    equals(other: EditorMode): boolean {
        return (
            other instanceof ExtendMode &&
            other.wrappedMode.equals(this.wrappedMode)
        );
    }
}
