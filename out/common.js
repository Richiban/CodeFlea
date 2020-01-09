"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function* zip(left, right) {
    while (true) {
        const lResult = left.next();
        const rResult = right.next();
        if (lResult.done || rResult.done) {
            return;
        }
        else {
            yield [lResult.value, rResult.value];
        }
    }
}
exports.zip = zip;
//# sourceMappingURL=common.js.map