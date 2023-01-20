import * as common from "../common";
import Enumerable from "../utils/Enumerable";
import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import InsertMode from "./InsertMode";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import { SubjectAction } from "../subjects/SubjectActions";
import CommandMode from "./CommandMode";

export default class ExtendMode extends EditorMode {
    private readonly wrappedMode: CommandMode;
    private readonly anchors: readonly vscode.Selection[] = [];
    private actives: readonly vscode.Selection[] = [];

    readonly cursorStyle = vscode.TextEditorCursorStyle.BlockOutline;
    readonly name = "EXTEND";
    readonly decorationType;
    get statusBarText(): string {
        return `Extend (${this.wrappedMode.subject.name})`;
    }

    constructor(
        private readonly context: common.ExtensionContext,
        previousMode: CommandMode
    ) {
        super();

        this.wrappedMode = previousMode;
        this.decorationType = this.wrappedMode.decorationType;
        this.anchors = [...this.context.editor.selections];
        this.actives = [...this.context.editor.selections];

        this.decorationType = vscode.window.createTextEditorDecorationType({
            dark: {
                border: `1px dashed ${previousMode.subject.outlineColour.dark}`,
            },
            light: {
                border: `1px dashed ${previousMode.subject.outlineColour.light}`,
            },
        });
    }

    async fixSelection() {
        await this.wrappedMode.fixSelection();
    }

    async changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode> {
        switch (newMode.kind) {
            case "INSERT":
                return new InsertMode(this.context, this.wrappedMode);
            case "COMMAND":
                return this.wrappedMode;
            case "EXTEND":
                if (!newMode.subjectName) {
                    throw new Error("No subject name provided");
                }

                if (newMode.subjectName !== this.wrappedMode.subject.name) {
                    await vscode.commands.executeCommand("cancelSelection");

                    return new CommandMode(
                        this.context,
                        subjects.createFrom(this.context, newMode.subjectName)
                    );
                }

                switch (newMode.subjectName) {
                    case "WORD":
                        return new CommandMode(
                            this.context,
                            subjects.createFrom(this.context, "SUBWORD")
                        );
                    case "SUBWORD":
                        return new CommandMode(
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
            wrappedMode: CommandMode;
        }>
    ) {
        return new ExtendMode(
            args.context ?? this.context,
            args.wrappedMode ?? this.wrappedMode
        );
    }

    async executeSubjectCommand(command: SubjectAction): Promise<void> {
        await this.extendSelections(() =>
            this.wrappedMode.executeSubjectCommand(command)
        );
    }

    async skip(direction: common.Direction) {
        await this.extendSelections(() => this.wrappedMode.skip(direction));
    }

    async repeatLastSkip(direction: common.Direction) {
        await this.extendSelections(() =>
            this.wrappedMode.repeatLastSkip(direction)
        );
    }

    async jump() {
        await this.extendSelections(() => this.wrappedMode.jump());
    }

    private async extendSelections(movement: () => Promise<void>) {
        this.context.editor.selections = this.actives;
        await movement();
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

    equals(other: EditorMode): boolean {
        return (
            other instanceof ExtendMode &&
            other.wrappedMode.equals(this.wrappedMode)
        );
    }
}
