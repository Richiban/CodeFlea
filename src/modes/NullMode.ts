import { createFrom } from "../subjects/subjects";
import EditMode from "./EditMode";
import ExtendMode from "./ExtendMode";
import * as common from "../common";
import { EditorMode, EditorModeType } from "./modes";
import NavigateMode from "./NavigateMode";

export class NullMode extends EditorMode {
    constructor(private readonly context: common.ExtensionContext) {
        super();
    }

    clearUI(): void {}

    equals(previousMode: EditorMode): boolean {
        return previousMode instanceof NullMode;
    }

    async changeTo(newMode: EditorModeType): Promise<EditorMode> {
        const defaultSubject = createFrom(this.context, "WORD");
        const navigateMode = new NavigateMode(this.context, defaultSubject);

        switch (newMode.kind) {
            case "EDIT":
                return new EditMode(this.context, navigateMode);

            case "EXTEND":
                return new ExtendMode(
                    this.context,
                    defaultSubject,
                    navigateMode
                );

            case "NAVIGATE":
                return navigateMode;
        }
    }

    refreshUI() {
        this.context.statusBar.text = `Initializing...`;
    }

    async executeSubjectCommand() {}

    async repeatSubjectCommand() {}
}
