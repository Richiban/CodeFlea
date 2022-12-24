import { createFrom } from "../subjects/subjects";
import InsertMode from "./InsertMode";
import ExtendMode from "./ExtendMode";
import * as common from "../common";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import FleaMode from "./FleaMode";

export default class NullMode extends EditorMode {
    readonly decorationType = undefined;
    readonly cursorStyle = undefined;
    readonly name = "NULL";
    readonly statusBarText = "Initialising...";

    constructor(private readonly context: common.ExtensionContext) {
        super();
    }

    equals(previousMode: EditorMode): boolean {
        return previousMode instanceof NullMode;
    }

    async changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode> {
        const defaultSubject = createFrom(this.context, "WORD");
        const navigateMode = new FleaMode(this.context, defaultSubject);

        switch (newMode.kind) {
            case "INSERT":
                return new InsertMode(this.context, navigateMode);

            case "EXTEND":
                return new ExtendMode(this.context, navigateMode);

            case "FLEA":
                return navigateMode;
        }
    }

    async executeSubjectCommand() {}
    async repeatSubjectCommand() {}
}
