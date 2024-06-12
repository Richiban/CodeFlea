import * as vscode from "vscode";
import { Char, Direction, TextObject } from "../common";
import Seq, { seq } from "../utils/seq";
import * as editor from "../utils/editor";
import { positionToRange } from "../utils/selectionsAndRanges";
import { iterCharacters } from "../utils/characters";
import { iterLines } from "../utils/lines";

export type IterationOptions = {
    startingPosition: TextObject | vscode.Position;
    direction: Direction;
    currentInclusive?: boolean;
    bounds?: TextObject;
};

export default abstract class SubjectIOBase {
    abstract deletableSeparators: RegExp;
    abstract defaultSeparationText: string;

    abstract getContainingObjectAt(
        document: vscode.TextDocument,
        position: vscode.Position
    ): TextObject | undefined;

    abstract iterScope(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Seq<TextObject>;

    getClosestObjectTo(
        document: vscode.TextDocument,
        position: vscode.Position
    ): TextObject {
        const wordRange = seq([
            this.iterAll(document, {
                startingPosition: position,
                direction: Direction.backwards,
            }).tryFirst(),
            this.iterAll(document, {
                startingPosition: position,
                direction: Direction.forwards,
            }).tryFirst(),
        ])
            .filterUndefined()
            .tryMinBy((w) => Math.abs(w.end.line - position.line));

        return wordRange ?? new vscode.Range(position, position);
    }

    abstract iterAll(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Seq<TextObject>;

    abstract iterHorizontally(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Seq<TextObject>;

    abstract iterVertically(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Seq<TextObject>;

    getSeparatingText(
        document: vscode.TextDocument,
        object: TextObject
    ): vscode.Range | undefined {
        const prevObject = this.iterScope(document, {
            direction: Direction.backwards,
            startingPosition: object,
            currentInclusive: false,
        }).tryFirst();

        const nextObject = this.iterScope(document, {
            direction: Direction.forwards,
            startingPosition: object,
            currentInclusive: false,
        }).tryFirst();

        const separatingTextRangeBefore = prevObject
            ? new vscode.Range(prevObject.end, object.start)
            : undefined;

        const separatingTextRangeAfter = nextObject
            ? new vscode.Range(object.end, nextObject.start)
            : undefined;

        const bestMatch = seq([
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

    skip(
        document: vscode.TextDocument,
        targetChar: Char,
        options: IterationOptions
    ): TextObject | undefined {
        for (const textObject of this.iterAll(document, options)) {
            const char = editor.charAt(document, textObject.start);

            if (char.toLowerCase() === targetChar.toLowerCase()) {
                return textObject;
            }
        }

        return undefined;
    }

    skipOver(
        document: vscode.TextDocument,
        skipChar: Char | undefined,
        options: IterationOptions
    ): TextObject | undefined {
        if (!skipChar) {
            for (const line of iterLines(document, options)) {
                if (line.isEmptyOrWhitespace) {
                    return this.iterAll(document, {
                        ...options,
                        startingPosition: line.range,
                        currentInclusive: false,
                    }).tryFirst();
                }
            }
            
            return;
        }

        for (const { char, position } of iterCharacters(document, options)) {
            if (char.toLowerCase() === skipChar.toLowerCase()) {
                return this.iterAll(document, {
                    ...options,
                    startingPosition: position,
                    currentInclusive: false,
                }).tryFirst();
            }
        }

        return undefined;
    }

    deleteObject(
        document: vscode.TextDocument,
        textEdit: vscode.TextEditorEdit,
        object: TextObject
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

            textEdit.insert(selection.end, separationText);
        }

        textEdit.insert(selection.end, document.getText(selection));

        return positionToRange(selection.end);
    }

    insertNew(
        document: vscode.TextDocument,
        textEdit: vscode.TextEditorEdit,
        currentObject: TextObject,
        direction: Direction
    ) {
        const separationTextRange = this.getSeparatingText(
            document,
            currentObject
        );

        const separationText = separationTextRange
            ? document.getText(separationTextRange)
            : this.defaultSeparationText;

        if (direction === Direction.forwards) {
            textEdit.insert(currentObject.end, separationText);
        } else {
            textEdit.insert(currentObject.start, separationText);
        }

        const insertionPoint =
            direction === Direction.forwards ? currentObject.end : currentObject.start;

        textEdit.insert(insertionPoint, "");

        return positionToRange(insertionPoint);
    }

    swapVertically(
        document: vscode.TextDocument,
        edit: vscode.TextEditorEdit,
        currentObject: TextObject,
        direction: Direction
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
        currentObject: TextObject,
        direction: Direction
    ): TextObject {
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
