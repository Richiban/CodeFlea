import { createFrom } from "../subjects/subjects";
import InsertMode from "./InsertMode";
import ExtendMode from "./ExtendMode";
import * as common from "../common";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import FleaMode from "./FleaMode";
import { defaultNumHandler as createDefaultNumHandler } from "../handlers/NumHandler";

export default class NullMode extends EditorMode {
    constructor(private readonly context: common.ExtensionContext) {
        super();
    }

    clearUI(): void {}

    equals(previousMode: EditorMode): boolean {
        return previousMode instanceof NullMode;
    }

    async changeTo(newMode: EditorModeChangeRequest): Promise<EditorMode> {
        const defaultSubject = createFrom(this.context, "WORD");
        const defaultNumHandler = createDefaultNumHandler(this.context);
        const navigateMode = new FleaMode(
            this.context,
            defaultSubject,
            defaultNumHandler
        );

        switch (newMode.kind) {
            case "INSERT":
                return new InsertMode(this.context, navigateMode);

            case "EXTEND":
                return new ExtendMode(
                    this.context,
                    navigateMode,
                    defaultNumHandler
                );

            case "FLEA":
                return navigateMode;
        }
    }

    changeNumHandler(): EditorMode {
        return this;
    }

    setUI() {
        this.context.statusBar.text = `Initializing...`;
    }

    async executeSubjectCommand() {}

    async repeatSubjectCommand() {}
}
