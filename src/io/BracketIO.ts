import * as vscode from "vscode";
import Enumerable, { enumerable } from "../utils/Enumerable";
import * as common from "../common";
import {
    closerPositionOf,
    positionToRange,
    wordRangeToPosition as rangeToPosition,
} from "../utils/selectionsAndRanges";
import SubjectIOBase, { IterationOptions } from "./SubjectIOBase";
import { iterLines } from "../utils/lines";
import { translateWithWrap } from "../utils/positions";
import { iterCharacters } from "../utils/characters";

const openingBrackets = "([{".split("");
const closingBrackets = ")]}".split("");

function getLeftBracket(
    document: vscode.TextDocument,
    startingPosition: vscode.Position
): { char: string; position: vscode.Position } | undefined {
    let unmatchedCloseBrackets = 0;
    let first = true;

    for (const { char, position } of iterCharacters(document, {
        startingPosition,
        direction: "backwards",
        currentInclusive: true,
    })) {
        if (openingBrackets.includes(char)) {
            if (unmatchedCloseBrackets === 0) {
                return { char, position };
            }

            if (unmatchedCloseBrackets > 0) {
                unmatchedCloseBrackets--;
            }
        }

        if (closingBrackets.includes(char) && !first) {
            unmatchedCloseBrackets++;
        }

        first = false;
    }

    return undefined;
}

function getRightBracket(
    document: vscode.TextDocument,
    startingPosition: vscode.Position
) {
    let unmatchedOpenBrackets = 0;
    let first = true;

    for (const { char, position } of iterCharacters(document, {
        startingPosition,
        direction: "forwards",
        currentInclusive: true,
    })) {
        if (closingBrackets.includes(char)) {
            if (unmatchedOpenBrackets === 0) {
                return { char, position };
            }

            if (unmatchedOpenBrackets > 0) {
                unmatchedOpenBrackets--;
            }
        }

        if (openingBrackets.includes(char) && !first) {
            unmatchedOpenBrackets++;
        }

        first = false;
    }

    return undefined;
}

function getLastPositionIn(document: vscode.TextDocument) {
    const lastLine = document.lineAt(document.lineCount - 1);

    return lastLine.range.end;
}

function iterRight(
    document: vscode.TextDocument,
    startingPosition: vscode.Position | vscode.Range,
    inclusive: boolean
) {
    const bounds =
        startingPosition instanceof vscode.Range
            ? startingPosition
            : new vscode.Range(startingPosition, getLastPositionIn(document));

    startingPosition = rangeToPosition(startingPosition, "backwards");

    return enumerable(function* () {
        for (const { char, position } of iterCharacters(document, {
            direction: "forwards",
            startingPosition,
            bounds,
            currentInclusive: true,
        })) {
            if (openingBrackets.includes(char)) {
                const rightBracket = getRightBracket(
                    document,
                    translateWithWrap(document, position, 1) ?? position
                );

                if (rightBracket) {
                    if (inclusive) {
                        yield new vscode.Range(
                            position,
                            rightBracket.position.translate(0, 1)
                        );
                    } else {
                        yield new vscode.Range(
                            position.translate(0, 1),
                            rightBracket.position
                        );
                    }
                }
            }
        }
    });
}

function iterLeft(
    document: vscode.TextDocument,
    startingPosition: vscode.Position | vscode.Range,
    inclusive: boolean
): Enumerable<vscode.Range> {
    startingPosition = rangeToPosition(startingPosition, "backwards");

    const bounds = new vscode.Range(
        new vscode.Position(0, 0),
        startingPosition
    );

    return enumerable(function* () {
        const characters = iterCharacters(document, {
            direction: "backwards",
            startingPosition,
            bounds,
            currentInclusive: true,
        }).tryElementAt(2);

        if (characters) {
            const object = getContainingObjectAt(
                document,
                characters.position,
                inclusive
            );

            if (object) {
                yield object;
            }
        }
    });
}

function getContainingObjectAt(
    document: vscode.TextDocument,
    position: vscode.Position,
    inclusive: boolean
): vscode.Range | undefined {
    const leftBracket = getLeftBracket(document, position);

    const rightBracket = getRightBracket(document, position);

    if (
        !leftBracket ||
        !rightBracket ||
        openingBrackets.indexOf(leftBracket.char) !==
            closingBrackets.indexOf(rightBracket.char)
    ) {
        return undefined;
    }

    if (inclusive) {
        return new vscode.Range(
            leftBracket.position,
            rightBracket.position.translate(0, 1)
        );
    } else {
        return new vscode.Range(
            leftBracket.position.translate(0, 1),
            rightBracket.position
        );
    }
}

function getClosestObjectTo(
    document: vscode.TextDocument,
    position: vscode.Position,
    inclusive: boolean
): vscode.Range {
    const leftBracket = iterCharacters(document, {
        startingPosition: position,
        direction: "backwards",
    })
        .filter(
            ({ char }) =>
                closingBrackets.includes(char) || openingBrackets.includes(char)
        )
        .tryFirst();

    const rightBracket = iterCharacters(document, {
        startingPosition: position,
        direction: "forwards",
    })
        .filter(
            ({ char }) =>
                openingBrackets.includes(char) || closingBrackets.includes(char)
        )
        .tryFirst();

    if (!leftBracket && !rightBracket) {
        return positionToRange(position);
    }

    const bestMatch =
        closerPositionOf(
            document,
            position,
            rightBracket?.position,
            leftBracket?.position
        ) ?? position;

    return (
        getContainingObjectAt(document, bestMatch, inclusive) ??
        positionToRange(bestMatch)
    );
}

function iterAll(
    document: vscode.TextDocument,
    options: IterationOptions,
    inclusive: boolean
): Enumerable<vscode.Range> {
    return enumerable(function* () {
        for (const { char, position } of iterCharacters(document, {
            ...options,
            currentInclusive: true,
        })) {
            if (openingBrackets.includes(char)) {
                const rightBracket = getRightBracket(
                    document,
                    translateWithWrap(document, position, 1) ?? position
                );

                if (rightBracket) {
                    if (inclusive) {
                        yield new vscode.Range(
                            position,
                            rightBracket.position.translate(0, 1)
                        );
                    } else {
                        yield new vscode.Range(
                            position.translate(0, 1),
                            rightBracket.position
                        );
                    }
                }
            }
        }
    });
}

function iterHorizontally(
    document: vscode.TextDocument,
    options: IterationOptions,
    inclusive: boolean
): Enumerable<vscode.Range> {
    if (options.direction === "forwards") {
        return iterRight(document, options.startingPosition, inclusive);
    } else {
        return iterLeft(document, options.startingPosition, inclusive);
    }
}

function iterScope(
    document: vscode.TextDocument,
    options: IterationOptions,
    inclusive: boolean
) {
    return iterAll(document, options, inclusive);
}

function iterVertically(
    document: vscode.TextDocument,
    options: IterationOptions,
    inclusive: boolean
): Enumerable<vscode.Range> {
    const startingPosition = rangeToPosition(
        options.startingPosition,
        options.direction
    );

    const bracketsToLookFor =
        options.direction === "forwards" ? openingBrackets : closingBrackets;

    return enumerable(function* () {
        for (const { char, position } of iterCharacters(document, {
            ...options,
            startingPosition,
            currentInclusive: false,
        })) {
            if (bracketsToLookFor.includes(char)) {
                const containingObject = getContainingObjectAt(
                    document,
                    position,
                    inclusive
                );

                if (containingObject) {
                    yield containingObject;
                }
            }
        }
    });
}

export default class BracketIO extends SubjectIOBase {
    deletableSeparators = /^[\s,.:=+\-*\/%]+$/;
    defaultSeparationText = " ";

    constructor(private inclusive: boolean) {
        super();
    }

    getContainingObjectAt(
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        return getContainingObjectAt(document, position, this.inclusive);
    }

    getClosestObjectTo(
        document: vscode.TextDocument,
        position: vscode.Position
    ) {
        return getClosestObjectTo(document, position, this.inclusive);
    }

    iterAll(document: vscode.TextDocument, options: IterationOptions) {
        return iterAll(document, options, this.inclusive);
    }

    iterHorizontally(document: vscode.TextDocument, options: IterationOptions) {
        return iterHorizontally(document, options, this.inclusive);
    }

    iterVertically(document: vscode.TextDocument, options: IterationOptions) {
        return iterVertically(document, options, this.inclusive);
    }

    iterScope(
        document: vscode.TextDocument,
        options: IterationOptions
    ): Enumerable<vscode.Range> {
        return iterScope(document, options, this.inclusive);
    }
}
