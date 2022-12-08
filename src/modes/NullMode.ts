import { createFrom } from "../subjects/subjects";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import * as common from "../common";
import { EditorMode, EditorModeChangeRequest } from "./modes";
import NavigateMode from "./NavigateMode";
import { defaultNumHandler as createDefaultNumHandler } from "../handlers/NumHandler";

export class NullMode extends EditorMode {
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
        const navigateMode = new NavigateMode(
            this.context,
            defaultSubject,
            defaultNumHandler
        );

        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, navigateMode);

            case "EXTEND":
                return new ExtendMode(
                    this.context,
                    navigateMode,
                    defaultNumHandler
                );

            case "NAVIGATE":
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
