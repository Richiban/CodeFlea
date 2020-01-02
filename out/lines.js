"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const editor_1 = require("./editor");
function lineIsBoring(line) {
    return !/[a-zA-Z0-9]/.test(line.text);
}
function lineIsIndentationChange(prevLine, currentLine) {
    return (prevLine.firstNonWhitespaceCharacterIndex !==
        currentLine.firstNonWhitespaceCharacterIndex);
}
function lineIsInteresting(prevLine, currentLine) {
    if (lineIsBoring(currentLine))
        return false;
    if (!prevLine)
        return true;
    return (lineIsIndentationChange(prevLine, currentLine) || lineIsBoring(prevLine));
}
function fromDirection(direction) {
    return direction === "forwards" ? (x) => x + 1 : (x) => x - 1;
}
function* iterLinesWithPrevious(document, currentLineNumber, direction) {
    const advance = fromDirection(direction);
    currentLineNumber = advance(currentLineNumber);
    while (withinBounds()) {
        const prevLine = currentLineNumber === 0
            ? undefined
            : document.lineAt(currentLineNumber - 1);
        const currentLine = document.lineAt(currentLineNumber);
        yield { prevLine, currentLine };
        currentLineNumber = advance(currentLineNumber);
    }
    function withinBounds() {
        return currentLineNumber >= 0 && currentLineNumber < document.lineCount;
    }
}
function* iterLines(document, currentLineNumber, direction) {
    const advance = fromDirection(direction);
    currentLineNumber = advance(currentLineNumber);
    while (withinBounds()) {
        yield document.lineAt(currentLineNumber);
        currentLineNumber = advance(currentLineNumber);
    }
    function withinBounds() {
        return currentLineNumber >= 0 && currentLineNumber < document.lineCount;
    }
}
function* iterLinesOutwards(document, currentLineNumber) {
    let forwardsPointer = currentLineNumber + 1;
    let backwardsPointer = currentLineNumber - 1;
    while (forwardsPointerInBounds() && backwardsPointerInBounds()) {
        const backwardsLine = backwardsPointerInBounds()
            ? document.lineAt(backwardsPointer)
            : undefined;
        const forwardsLine = forwardsPointerInBounds()
            ? document.lineAt(forwardsPointer)
            : undefined;
        yield { backwardsLine, forwardsLine };
        forwardsPointer++;
        backwardsPointer--;
    }
    function forwardsPointerInBounds() {
        return forwardsPointer <= document.lineCount;
    }
    function backwardsPointerInBounds() {
        return backwardsPointer >= 0;
    }
}
function toDiff(change) {
    if (change === "greaterThan")
        return (x, y) => x > y;
    return (x, y) => x < y;
}
function getNearestLineOfChangeOfIndentation(document, currentLine, change) {
    const diff = toDiff(change);
    for (const { backwardsLine, forwardsLine } of iterLinesOutwards(document, currentLine.lineNumber)) {
        if (forwardsLine &&
            !forwardsLine.isEmptyOrWhitespace &&
            diff(forwardsLine.firstNonWhitespaceCharacterIndex, currentLine.firstNonWhitespaceCharacterIndex))
            return forwardsLine;
        if (backwardsLine &&
            !backwardsLine.isEmptyOrWhitespace &&
            diff(backwardsLine.firstNonWhitespaceCharacterIndex, currentLine.firstNonWhitespaceCharacterIndex))
            return backwardsLine;
    }
}
function getNextLineOfChangeOfIndentation(change, direction, document, currentLine) {
    const diff = toDiff(change);
    for (const line of iterLines(document, currentLine.lineNumber, direction)) {
        if (line &&
            !line.isEmptyOrWhitespace &&
            diff(line.firstNonWhitespaceCharacterIndex, currentLine.firstNonWhitespaceCharacterIndex))
            return line;
    }
}
exports.getNextLineOfChangeOfIndentation = getNextLineOfChangeOfIndentation;
function moveToChangeOfIndentation(change, direction) {
    const cursorPosition = editor_1.default.getCursorPosition();
    const document = editor_1.default.getDocument();
    if (cursorPosition && document) {
        let line;
        const currentLine = document.lineAt(cursorPosition.line);
        switch (direction) {
            case "nearest": {
                line = getNearestLineOfChangeOfIndentation(document, document.lineAt(cursorPosition.line), change);
                break;
            }
            case "backwards":
            case "forwards": {
                line = getNextLineOfChangeOfIndentation(change, direction, document, currentLine);
                break;
            }
        }
        if (line)
            editor_1.default.moveCursorToBeginningOfLine(line);
    }
}
exports.moveToChangeOfIndentation = moveToChangeOfIndentation;
function moveToNextInterestingLine(direction) {
    const cursorPosition = editor_1.default.getCursorPosition();
    const document = editor_1.default.getDocument();
    if (cursorPosition && document) {
        const documentLines = iterLinesWithPrevious(document, cursorPosition.line, direction);
        for (const { prevLine, currentLine } of documentLines) {
            if (lineIsInteresting(prevLine, currentLine)) {
                editor_1.default.moveCursorToBeginningOfLine(currentLine);
                break;
            }
        }
    }
}
function moveToLineOfSameIndentation(direction) {
    const cursorPosition = editor_1.default.getCursorPosition();
    const document = editor_1.default.getDocument();
    if (cursorPosition && document) {
        const documentLines = iterLines(document, cursorPosition.line, direction);
        const currentLine = document.lineAt(cursorPosition.line);
        for (const line of documentLines) {
            if (currentLine.firstNonWhitespaceCharacterIndex ===
                line.firstNonWhitespaceCharacterIndex &&
                !line.isEmptyOrWhitespace) {
                editor_1.default.moveCursorToBeginningOfLine(line);
                break;
            }
        }
    }
}
exports.default = {
    moveToLineOfSameIndentation,
    moveToChangeOfIndentation,
    moveToNextInterestingLine
};
//# sourceMappingURL=lines.js.map