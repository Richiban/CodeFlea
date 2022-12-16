import * as vscode from "vscode";
import * as common from "../common";
import Linqish from "../utils/Linqish";
import * as editor from "../utils/editor";

export type IterationOptions = {
    startingPosition: common.TextObject | vscode.Position;
    direction: common.Direction;
    currentInclusive?: boolean;
    restrictToCurrentScope?: boolean;
    bounds?: common.TextObject;
};

export default abstract class SubjectIOBase {
    abstract deletableSeparators: RegExp;

    abstract getContainingObjectAt(
        document: vscode.TextDocument,
        position: vscode.Position
    ): common.TextObject | undefined;

    getClosestObjectTo(
        document: vscode.TextDocument,
        position: vscode.Position
    ): common.TextObject {
        const wordRange = new Linqish([
            this.iterAll(document, {
                startingPosition: position,
                direction: "backwards",
            }).tryFirst(),
            this.iterAll(document, {
                startingPosition: position,
                direction: "forwards",
            }).tryFirst(),
        ]).tryMinBy((w) => Math.abs(w!.end.line - position.line));

        return wordRange ?? new vscode.Range(position, position);
    }

    abstract iterAll(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Linqish<common.TextObject>;
    abstract iterHorizontally(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Linqish<common.TextObject>;
    abstract iterVertically(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Linqish<common.TextObject>;

    getSeparatingText(
        document: vscode.TextDocument,
        object: common.TextObject
    ): vscode.Range | undefined {
        const prevObject = this.iterAll(document, {
            direction: common.Direction.backwards,
            startingPosition: object,
            currentInclusive: false,
        }).tryFirst();

        const nextObject = this.iterAll(document, {
            direction: common.Direction.forwards,
            startingPosition: object,
            currentInclusive: false,
        }).tryFirst();

        const separatingTextRangeBefore = prevObject
            ? new vscode.Range(prevObject.end, object.start)
            : undefined;

        const separatingTextRangeAfter = nextObject
            ? new vscode.Range(object.end, nextObject.start)
            : undefined;

        const bestMatch = new Linqish([
            separatingTextRangeBefore,
            separatingTextRangeAfter,
        ])
            .filterMap((separatingRange) => {
                if (!separatingRange) {
                    return undefined;
                }

                const separatingText = document.getText(separatingRange);

                if (separatingText.match(this.deletableSeparators)) {
                    return { separatingText, separatingRange };
                }
            })
            .tryMinBy((x) => x.separatingText.length);

        if (bestMatch) {
            return bestMatch.separatingRange;
        }
    }

    search(
        document: vscode.TextDocument,
        targetChar: common.Char,
        options: IterationOptions
    ): vscode.Range | undefined {
        for (const wordRange of this.iterAll(document, options)) {
            const char = editor.charAt(document, wordRange.start);

            if (char.toLowerCase() === targetChar.toLowerCase()) {
                return wordRange;
            }
        }

        return undefined;
    }

    deleteObject(
        document: vscode.TextDocument,
        textEdit: vscode.TextEditorEdit,
        object: common.TextObject
    ): void {
        textEdit.delete(object);
        const separatingText = this.getSeparatingText(document, object);

        if (separatingText) {
            textEdit.delete(separatingText);
        }
    }

    duplicate(
        document: vscode.TextDocument,
        textEdit: vscode.TextEditorEdit,
        selection: vscode.Selection
    ): vscode.Range {
        const separationTextRange = this.getSeparatingText(document, selection);

        if (separationTextRange) {
            const separationText = document.getText(separationTextRange);

            if (separationTextRange.start <= selection.end) {
                textEdit.insert(selection.end, separationText);
            } else {
                textEdit.insert(selection.start, separationText);
            }
        }

        textEdit.insert(selection.end, document.getText(selection));

        return selection;
    }

    swapVertically(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        currentObject: common.TextObject,
        direction: common.Direction
    ): vscode.Range {
        const thisObject = this.getContainingObjectAt(
            document,
            currentObject.start
        );

        const nextObject = this.iterVertically(document, {
            startingPosition: currentObject.start,
            direction,
        }).tryFirst();

        if (!nextObject || !thisObject) {
            return currentObject;
        }

        editor.swap(document, edit, thisObject, nextObject);

        return new vscode.Selection(nextObject.end, nextObject.start);
    }

    swapHorizontally(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        currentObject: common.TextObject,
        direction: common.Direction
    ): common.TextObject {
        const thisObject = this.getContainingObjectAt(
            document,
            currentObject.start
        );

        const nextObject = this.iterHorizontally(document, {
            startingPosition: currentObject.start,
            direction,
        }).tryFirst();

        if (!nextObject || !thisObject) {
            return currentObject;
        }

        editor.swap(document, edit, thisObject, nextObject);

        return nextObject;
    }
}
