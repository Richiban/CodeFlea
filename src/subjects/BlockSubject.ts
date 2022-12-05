import * as blocks from "../readers/blocks";
import * as vscode from "vscode";
import * as selections from "../utils/selectionsAndRanges";
import * as common from "../common";
import { Subject } from "./Subject";
import blockReader from "../readers/blocks";
import blockWriter from "../writers/blocks";

export class BlockSubject extends Subject {
    protected subjectReader = blockReader;
    protected subjectWriter = blockWriter;
    protected decorationType = BlockSubject.decorationType;
    readonly name = "BLOCK";

    public static decorationType = vscode.window.createTextEditorDecorationType(
        {
            border: "1px solid #aba246;",
        }
    );

    async firstSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterBlocksInCurrentScope(this.context.editor.document, {
                    fromPosition: selection.start,
                    direction: "backwards",
                })
                .tryLast()
        );
    }

    async lastSubjectInScope() {
        selections.tryMap(this.context.editor, (selection) =>
            blocks
                .iterBlocksInCurrentScope(this.context.editor.document, {
                    fromPosition: selection.start,
                    direction: "forwards",
                })
                .tryLast()
        );
    }
}
