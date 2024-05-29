import * as vscode from "vscode";
import * as common from "../common";
import ExtendMode from "./ExtendMode";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import CommandMode from "./CommandMode";
import * as subjects from "../subjects/subjects";

export default class InsertMode extends EditorMode {
    private keySequenceStarted: boolean = false;
    readonly cursorStyle = vscode.TextEditorCursorStyle.Line;
    readonly decorationType = undefined;
    readonly decorationTypeTop = undefined;
    readonly decorationTypeMid = undefined;
    readonly decorationTypeBottom = undefined;
    readonly name = "INSERT";
    readonly statusBarText = "Insert";

    constructor(
        private readonly context: common.ExtensionContext,
        private previousNavigateMode: CommandMode
    ) {
        super();
    }

    equals(previousMode: EditorMode): boolean {
        return (
            previousMode instanceof InsertMode &&
            previousMode.keySequenceStarted === this.keySequenceStarted
        );
    }

    async changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode> {
        switch (newMode.kind) {
            case "INSERT":
                return this;
            case "EXTEND":
                return new ExtendMode(this.context, this.previousNavigateMode);

            case "COMMAND":
                if (!newMode.subjectName) {
                    return this.previousNavigateMode;
                } else {
                    const subject = subjects.createFrom(
                        this.context,
                        newMode.subjectName
                    );

                    return new CommandMode(this.context, subject);
                }
        }
    }

    async executeSubjectCommand() {}
    async repeatLastSkip() {}
    async skip() {}
    async skipOver() {}
    async jump() {}
    async jumpToSubject() { return undefined; }
}
