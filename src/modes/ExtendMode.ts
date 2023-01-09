import * as common from "../common";
import Enumerable from "../utils/Enumerable";
import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import InsertMode from "./InsertMode";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import FleaMode from "./FleaMode";
import { SubjectAction } from "../subjects/SubjectActions";

export default class ExtendMode extends EditorMode {
    private readonly wrappedMode: FleaMode;
    private readonly anchors: vscode.Selection[] = [];
    private actives: readonly vscode.Selection[] = [];

    readonly cursorStyle = vscode.TextEditorCursorStyle.BlockOutline;
    readonly name = "EXTEND";
    readonly decorationType;
    get statusBarText(): string {
        return `Extend (${this.wrappedMode.subject.name})`;
    }

    constructor(
        private readonly context: common.ExtensionContext,
        previousMode: FleaMode
    ) {
        super();

        this.wrappedMode = previousMode;
        this.decorationType = this.wrappedMode.decorationType;
        this.anchors = [...this.context.editor.selections];
        this.actives = [...this.context.editor.selections];

        this.decorationType = vscode.window.createTextEditorDecorationType({
            border: `1px dashed ${previousMode.subject.outlineColour}`,
        });
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
                if (!newMode.subjectName) {
                    throw new Error("No subject name provided");
                }

                if (newMode.subjectName !== this.wrappedMode.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new FleaMode(
                        this.context,
                        subjects.createFrom(this.context, newMode.subjectName)
                    );
                }

                switch (newMode.subjectName) {
                    case "WORD":
                        return new FleaMode(
                            this.context,
                            subjects.createFrom(this.context, "SUBWORD")
                        );
                    case "SUBWORD":
                        return new FleaMode(
                            this.context,
                            subjects.createFrom(this.context, "WORD")
                        );
                }

                return this;
        }
    }

    with(
        args: Partial<{
            context: common.ExtensionContext;
            wrappedMode: FleaMode;
        }>
    ) {
        return new ExtendMode(
            args.context ?? this.context,
            args.wrappedMode ?? this.wrappedMode
        );
    }

    async executeSubjectCommand(command: SubjectAction): Promise<void> {
        this.context.editor.selections = this.actives;
        await this.wrappedMode.executeSubjectCommand(command);
        this.actives = this.context.editor.selections;

        this.context.editor.selections = new Enumerable(this.anchors)
            .zipWith(this.context.editor.selections)
            .map(([anchor, active]) => {
                const newRange = anchor.union(active);

                if (anchor.start.isBefore(active.start)) {
                    return new vscode.Selection(newRange.start, newRange.end);
                } else {
                    return new vscode.Selection(newRange.end, newRange.start);
                }
            })
            .toArray();
    }

    async repeatLastSkip() {}

    equals(other: EditorMode): boolean {
        return (
            other instanceof ExtendMode &&
            other.wrappedMode.equals(this.wrappedMode)
        );
    }
}
