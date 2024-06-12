import * as vscode from "vscode";
import { Position, Range, TextDocument } from "vscode";
import {
    Direction,
    TextObject,
    directionToDelta,
    directionToFactor,
    invert,
} from "../common";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";
import Seq, { seq } from "../utils/seq";
import { rangeToPosition } from "../utils/selectionsAndRanges";

function getContainingRangeAt(
    document: TextDocument,
    position: Position
): Range {
    const offset = document.offsetAt(position);
    const fixedPosition = document.positionAt(offset);

    const range = new Range(fixedPosition, document.positionAt(offset + 1));

    if (range.start.character !== 0 && document.getText(range) === "\n") {
        return new Range(document.positionAt(offset - 1), fixedPosition);
    }

    return range;
}

function iterAll(
    document: TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    return seq(function* () {
        let offset = document.offsetAt(
            rangeToPosition(options.startingPosition, invert(options.direction))
        );
        let maxOffset = document.getText().length;

        while (offset >= 0 && offset < maxOffset) {
            const nextOffset = directionToDelta(options.direction)(offset);
            const range = new Range(
                document.positionAt(offset),
                document.positionAt(nextOffset)
            );

            if (
                !range.isEmpty &&
                range.isSingleLine &&
                (range.start.character === 0 ||
                    document.getText(range) !== "\n")
            )
                yield range;

            offset = nextOffset;
        }
    }).skip(options.currentInclusive ? 0 : 1);
}

function getClosestObjectTo(
    document: TextDocument,
    position: Position
): TextObject {
    const r = new Range(position, position.translate(0, 1));

    if (document.getText(r)) {
        return r;
    }

    return new Range(position, position);
}

function iterVertically(
    document: TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    return seq(function* () {
        let current: vscode.Position | undefined = rangeToPosition(
            options.startingPosition,
            Direction.backwards
        );

        while (current) {
            yield getContainingRangeAt(document, current);

            current = current.translate(
                directionToFactor(options.direction),
                0
            );
        }
    }).skip(options.currentInclusive ? 0 : 1);
}

function iterScope(
    document: TextDocument,
    options: IterationOptions
): Seq<TextObject> {
    const startingLine = document.lineAt(
        rangeToPosition(options.startingPosition, options.direction).line
    );

    return iterAll(document, options).takeWhile((r) =>
        startingLine.range.contains(r.start)
    );
}

export default class CharIO extends SubjectIOBase {
    deletableSeparators = /^$/;
    defaultSeparationText = " ";

    getContainingObjectAt = getContainingRangeAt;
    getClosestObjectTo = getClosestObjectTo;
    iterAll = iterAll;
    iterVertically = iterVertically;
    iterHorizontally = iterAll;
    iterScope = iterScope;

    getSeparatingText() {
        return undefined;
    }
}
