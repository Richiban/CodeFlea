import * as vscode from "vscode";
import * as subjects from "../subjects/subjects";
import InsertMode from "./InsertMode";
import ExtendMode from "./ExtendMode";
import * as modes from "./modes";
import * as editor from "../utils/editor";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import SubjectBase from "../subjects/SubjectBase";
import { SubjectAction } from "../subjects/SubjectActions";
import JumpInterface from "../handlers/JumpInterface";

export default class FleaMode extends modes.EditorMode {
    private lastSkip: common.Char | undefined = undefined;

    readonly cursorStyle = vscode.TextEditorCursorStyle.UnderlineThin;
    readonly name = "FLEA";

    readonly decorationType: vscode.TextEditorDecorationType;

    get statusBarText(): string {
        const skipString = this.lastSkip ? ` | Skip: ${this.lastSkip}` : ``;

        return `Flea mode (${this.subject.displayName})${skipString}`;
    }

    constructor(
        private readonly context: common.ExtensionContext,
        public readonly subject: SubjectBase
    ) {
        super();

        this.decorationType = vscode.window.createTextEditorDecorationType({
            border: `1px solid ${subject.outlineColour}`,
        });
    }

    equals(previousMode: modes.EditorMode): boolean {
        return (
            previousMode instanceof FleaMode &&
            previousMode.subject.equals(this.subject)
        );
    }

    with(
        args: Partial<{
            context: common.ExtensionContext;
            subject: SubjectBase;
        }>
    ) {
        return new FleaMode(
            args.context ?? this.context,
            args.subject ?? this.subject
        );
    }

    async changeTo(
        newMode: modes.EditorModeChangeRequest
    ): Promise<modes.EditorMode> {
        switch (newMode.kind) {
            case "INSERT":
                return new InsertMode(this.context, this);

            case "EXTEND":
                return new ExtendMode(this.context, this);

            case "FLEA":
                if (editor) {
                    selections.collapseSelections(this.context.editor, "start");
                }

                if (!newMode.subjectName) {
                    return this;
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
                    case "BRACKETS":
                        return this.with({
                            subject: subjects.createFrom(
                                this.context,
                                "BRACKETS_INCLUSIVE"
                            ),
                        });
                    case "BRACKETS_INCLUSIVE":
                        return this.with({
                            subject: subjects.createFrom(
                                this.context,
                                "BRACKETS"
                            ),
                        });
                }

                return this;
        }
    }

    async executeSubjectCommand(command: SubjectAction): Promise<void> {
        await this.subject[command]();
    }

    async fixSelection() {
        await this.subject.fixSelection();
    }

    async skip(direction: common.Direction): Promise<void> {
        const skipChar = await editor.inputBoxChar(
            `Skip ${direction} to a ${this.subject.name} by its first character`
        );

        if (skipChar === undefined) {
            return;
        }

        this.lastSkip = skipChar;

        await this.subject.skip(direction, skipChar);
    }

    async repeatLastSkip(direction: common.Direction): Promise<void> {
        if (!this.lastSkip) {
            return;
        }

        await this.subject.skip(direction, this.lastSkip);
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
