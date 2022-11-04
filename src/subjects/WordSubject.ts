import * as vscode from "vscode";
import { select } from "../editor";
import ModeManager from "../modes/ModeManager";
import { Subject, SubjectName } from "./subjects";

export default class WordSubject implements Subject {
    get name(): SubjectName {
        return "WORD";
    }

    constructor(private manager: ModeManager) {}

    fixSelection(direction: "left" | "right") {
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

            if (direction === "left") {
                return new vscode.Selection(newEnd, newStart);
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
        await vscode.commands.executeCommand("cursorWordLeft");
        this.fixSelection("left");
    }
    async nextSubjectRight(): Promise<void> {
        await vscode.commands.executeCommand("cursorWordRight");
        this.fixSelection("right");
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
        await this.fixSelection("right");
        await vscode.commands.executeCommand("deleteRight");
    }
}
