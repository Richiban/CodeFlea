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
        if (idx <= 0)
            return 0;
        if (idx >= s.length)
            return s.length;
        if (isPunctuation(s[idx - 1]) && !isPunctuation(s[idx])) {
            return nextNonWhiteSpaceChar(s, idx);
        }
    } while (true);
    return idx;
}
function moveToInterestingPoint(direction) {
    const cursorPosition = editor_1.default.getCursorPosition();
    const document = editor_1.default.getDocument();
    if (!cursorPosition || !document)
        return;
    const currentLine = document.lineAt(cursorPosition.line);
    const index = getIndexOfNextPunctuationChar(currentLine.text, {
        backwards: direction === "backwards",
        startingIndex: cursorPosition.character
    });
    if (index)
        editor_1.default.moveCursorTo(cursorPosition.line, index);
}
exports.default = { moveToInterestingPoint };
//# sourceMappingURL=points.js.map