"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const editor_1 = require("./editor");
const nonPunctuationRegex = /[a-zA-Z0-9]/;
function isPunctuation(char) {
    return !nonPunctuationRegex.test(char);
}
function nextNonWhiteSpaceChar(s, startingIndex) {
    let i = startingIndex;
    while (/\s/.test(s[i])) {
        i++;
    }
    return i;
}
function getIndexOfNextPunctuationChar(s, options = {
    startingIndex: 0,
    backwards: false
}) {
    let idx = options.startingIndex;
    const advance = options.backwards
        ? (x) => x - 1
        : (x) => x + 1;
    do {
        idx = advance(idx);
        if (idx === 0)
            return 0;
        if (idx < 0)
            return undefined;
        if (idx === s.length)
            return s.length;
        if (idx > s.length)
            return undefined;
        if (isPunctuation(s[idx - 1]) && !isPunctuation(s[idx])) {
            return nextNonWhiteSpaceChar(s, idx);
        }
    } while (true);
}
function moveToInterestingPoint(direction) {
    var _a;
    const cursorPosition = editor_1.getCursorPosition();
    const document = (_a = editor_1.getEditor()) === null || _a === void 0 ? void 0 : _a.document;
    if (!cursorPosition || !document)
        return;
    const currentLine = document.lineAt(cursorPosition.line);
    const index = getIndexOfNextPunctuationChar(currentLine.text, {
        backwards: direction === "backwards",
        startingIndex: cursorPosition.character
    });
    if (index)
        editor_1.moveCursorTo(cursorPosition.line, index);
    else {
        if (direction === "backwards" && cursorPosition.line > 0) {
            editor_1.moveCursorToEndOfLine(document.lineAt(cursorPosition.line - 1));
        }
        else if (direction === "forwards" &&
            cursorPosition.line < document.lineCount - 1) {
            editor_1.moveCursorToBeginningOfLine(document.lineAt(cursorPosition.line + 1));
        }
    }
}
exports.default = { moveToInterestingPoint };
//# sourceMappingURL=points.js.map