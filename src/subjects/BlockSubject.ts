import * as common from "../common";
import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import SubjectBase from "./SubjectBase";
import BlockIO from "../io/BlockIO";

export default class BlockSubject extends SubjectBase {
    protected subjectIO = new BlockIO();
    public decorationType = BlockSubject.decorationType;
    readonly name = "BLOCK";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #aba246;",
        }
    );

    async firstSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection.start,
                    direction: common.Direction.backwards,
                    restrictToCurrentScope: true,
                })
                .tryLast()
        );
    }

    async lastSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            this.subjectIO
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection.start,
                    direction: common.Direction.forwards,
                    restrictToCurrentScope: true,
                })
                .tryLast()
        );
    }
}
