import * as vscode from "vscode";
import * as common from "../common";
import ExtendMode from "./ExtendMode";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import FleaMode from "./FleaMode";
import * as subjects from "../subjects/subjects";

const decorationType = vscode.window.createTextEditorDecorationType({});

export default class InsertMode extends EditorMode {
    private keySequenceStarted: boolean = false;
    readonly decorationType = decorationType;
    readonly cursorStyle = undefined;
    readonly name = "INSERT";
    readonly statusBarText = "Insert";

    constructor(
        private readonly context: common.ExtensionContext,
        private previousNavigateMode: FleaMode
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

            case "FLEA":
                if (!newMode.subjectName) {
                    return this.previousNavigateMode;
                } else {
                    const subject = subjects.createFrom(
                        this.context,
                        newMode.subjectName
                    );

                    return new FleaMode(this.context, subject);
                }
        }
    }

    async executeSubjectCommand() {}
    async repeatSubjectCommand() {}
}
