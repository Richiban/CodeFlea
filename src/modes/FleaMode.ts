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

    readonly cursorStyle = vscode.TextEditorCursorStyle.UnderlineThin;
    readonly name = "FLEA";

    get decorationType(): vscode.TextEditorDecorationType {
        return this.subject.decorationType;
    }

    get statusBarText(): string {
        return `Flea mode (${this.subject.displayName})`;
    }

    constructor(
        private readonly context: common.ExtensionContext,
        public readonly subject: SubjectBase
    ) {
        super();
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
            numHandler: NumHandler;
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

        await (this.subject[this.lastCommand.commandName] as any)(
            ...this.lastCommand.args
        );
    }

    async fixSelection() {
        await this.subject.fixSelection();
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
