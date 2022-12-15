import * as common from "../common";
import Linqish from "../utils/Linqish";
import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import InsertMode from "./InsertMode";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import FleaMode from "./FleaMode";
import { NumHandler } from "../handlers/NumHandler";
import { SubjectAction } from "../subjects/SubjectActions";

export default class ExtendMode extends EditorMode {
    private readonly wrappedMode: FleaMode;
    private readonly anchors: vscode.Selection[] = [];

    constructor(
        private readonly context: common.ExtensionContext,
        previousMode: FleaMode,
        private readonly numHandler: NumHandler
    ) {
        super();

        this.wrappedMode = previousMode;
        this.anchors = [...this.context.editor.selections];
    }

    async fixSelection() {
        await this.wrappedMode.fixSelection();
    }

    async changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode> {
        switch (newMode.kind) {
            case "INSERT":
                return new InsertMode(this.context, this.wrappedMode);
            case "FLEA":
                return this.wrappedMode;
            case "EXTEND":
                if (newMode.subjectName !== this.wrappedMode.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new FleaMode(
                        this.context,
                        subjects.createFrom(this.context, newMode.subjectName),
                        this.numHandler
                    );
                }

                switch (newMode.subjectName) {
                    case "WORD":
                        return new FleaMode(
                            this.context,
                            subjects.createFrom(this.context, "SUBWORD"),
                            this.numHandler
                        );
                    case "SUBWORD":
                        return new FleaMode(
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
            wrappedMode: FleaMode;
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
        }

        await vscode.commands.executeCommand(
            "setContext",
            "codeFlea.mode",
            "EXTEND"
        );

        this.wrappedMode.fixSelection();
    }

    async executeSubjectCommand(command: SubjectAction): Promise<void> {
        await this.wrappedMode.executeSubjectCommand(command);

        const newSelections = new Linqish(this.anchors)
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
