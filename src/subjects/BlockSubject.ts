import * as common from "../common";
import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import { Subject } from "./Subject";
import blockReader from "../readers/blocks";
import blockWriter from "../writers/blocks";

export class BlockSubject extends Subject {
    protected subjectReader = blockReader;
    protected subjectWriter = blockWriter;
    public decorationType = BlockSubject.decorationType;
    readonly name = "BLOCK";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #aba246;",
        }
    );

    async firstSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            blockReader
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
            blockReader
                .iterVertically(this.context.editor.document, {
                    startingPosition: selection.start,
                    direction: common.Direction.forwards,
                    restrictToCurrentScope: true,
                })
                .tryLast()
        );
    }
}
