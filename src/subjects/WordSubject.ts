import * as vscode from "vscode";
import { select } from "../editor";
import ModeManager from "../modes/ModeManager";
import { Subject, SubjectName } from "./subjects";

export default class WordSubject implements Subject {
    get name(): SubjectName {
        return "WORD";
    }

    constructor(private manager: ModeManager) {}

    fixSelection() {
        const editor = this.manager.editor;

        if (!editor) {
            return;
        }

        editor.selections = editor.selections.map((selection) => {
            let [newStart, newEnd] = [selection.start, selection.end];

            const leftWord = editor.document.getWordRangeAtPosition(
                selection.start
            );

            if (leftWord && !selection.start.isEqual(leftWord.start)) {
                newStart = leftWord.start;
            }

            const rightWord = editor.document.getWordRangeAtPosition(
                selection.end
            );

            if (rightWord && !selection.end.isEqual(rightWord.end)) {
                newEnd = rightWord.end;
            }

            return new vscode.Selection(newStart, newEnd);
        });
    }

    async nextSubjectDown() {
        throw new Error("Method not implemented.");
    }
    async nextSubjectUp() {
        throw new Error("Method not implemented.");
    }
    async nextSubjectLeft(): Promise<void> {
        if (!this.manager.editor) {
            return;
        }

        this.manager.editor.selections = this.manager.editor.selections.map(
            (selection) => {
                if (!selection.isReversed) {
                    return new vscode.Selection(selection.end, selection.start);
                }

                return selection;
            }
        );

        await vscode.commands.executeCommand("cursorWordLeft");
        this.fixSelection();
    }
    async nextSubjectRight(): Promise<void> {
        if (!this.manager.editor) {
            return;
        }

        this.manager.editor.selections = this.manager.editor.selections.map(
            (selection) => {
                if (selection.isReversed) {
                    return new vscode.Selection(selection.end, selection.start);
                }

                return selection;
            }
        );

        await vscode.commands.executeCommand("cursorWordRight");
        this.fixSelection();
    }

    async addSubjectDown() {
        throw new Error("Method not implemented.");
    }
    async addSubjectUp() {
        throw new Error("Method not implemented.");
    }
    async addSubjectLeft() {
        throw new Error("Method not implemented.");
    }
    async addSubjectRight() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectDown() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectUp() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectLeft() {
        throw new Error("Method not implemented.");
    }

    async extendSubjectRight() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectDown() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectUp() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectLeft() {
        throw new Error("Method not implemented.");
    }
    async swapSubjectRight() {
        throw new Error("Method not implemented.");
    }

    async delete() {
        await this.fixSelection();
        await vscode.commands.executeCommand("deleteRight");
    }
}
