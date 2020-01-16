"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("./common");
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
exports.getNearestLineOfChangeOfIndentation = getNearestLineOfChangeOfIndentation;
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
    var _a;
    const cursorPosition = editor_1.getCursorPosition();
    const document = (_a = editor_1.getEditor()) === null || _a === void 0 ? void 0 : _a.document;
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
            editor_1.moveCursorToBeginningOfLine(line);
    }
}
exports.moveToChangeOfIndentation = moveToChangeOfIndentation;
function* getNextInterestingLines(direction) {
    var _a;
    const cursorPosition = editor_1.getCursorPosition();
    const document = (_a = editor_1.getEditor()) === null || _a === void 0 ? void 0 : _a.document;
    if (cursorPosition && document) {
        const documentLines = iterLinesWithPrevious(document, cursorPosition.line, direction);
        for (const { prevLine, currentLine } of documentLines) {
            if (lineIsInteresting(prevLine, currentLine)) {
                yield currentLine;
            }
        }
    }
}
exports.getNextInterestingLines = getNextInterestingLines;
function flip(direction) {
    switch (direction) {
        case "forwards":
            return "backwards";
        case "backwards":
            return "forwards";
    }
}
function getInterestingLines(pattern, direction) {
    var _a;
    const cursorPosition = editor_1.getCursorPosition();
    const document = (_a = editor_1.getEditor()) === null || _a === void 0 ? void 0 : _a.document;
    if (!document || !cursorPosition)
        return common_1.linqish.empty;
    const linesForwards = iterLinesWithPrevious(document, cursorPosition.line, direction);
    const linesBackwards = iterLinesWithPrevious(document, cursorPosition.line, flip(direction));
    const [a, b] = direction === "forwards"
        ? [linesForwards, linesBackwards]
        : [linesBackwards, linesForwards];
    switch (pattern) {
        case "alternate":
            return common_1.linqish(a)
                .interleave(b)
                .filter(({ prevLine, currentLine }) => lineIsInteresting(prevLine, currentLine))
                .map(({ prevLine: _, currentLine }) => currentLine);
        case "sequential":
            return common_1.linqish(a)
                .union(b)
                .filter(({ prevLine, currentLine }) => lineIsInteresting(prevLine, currentLine))
                .map(({ prevLine: _, currentLine }) => currentLine);
    }
}
exports.getInterestingLines = getInterestingLines;
function moveToNextInterestingLine(direction) {
    for (const line of getNextInterestingLines(direction)) {
        editor_1.moveCursorToBeginningOfLine(line);
        return;
    }
}
exports.moveToNextInterestingLine = moveToNextInterestingLine;
function moveToLineOfSameIndentation(direction) {
    var _a;
    const cursorPosition = editor_1.getCursorPosition();
    const document = (_a = editor_1.getEditor()) === null || _a === void 0 ? void 0 : _a.document;
    if (cursorPosition && document) {
        const documentLines = iterLines(document, cursorPosition.line, direction);
        const currentLine = document.lineAt(cursorPosition.line);
        for (const line of documentLines) {
            if (currentLine.firstNonWhitespaceCharacterIndex ===
                line.firstNonWhitespaceCharacterIndex &&
                !line.isEmptyOrWhitespace) {
                editor_1.moveCursorToBeginningOfLine(line);
                break;
            }
        }
    }
}
exports.moveToLineOfSameIndentation = moveToLineOfSameIndentation;
//# sourceMappingURL=lines.js.map