"use strict";
function* pairwise(iter, includeFirst) {
    let prev = undefined;
    let isFirst = true;
    for (const item of iter) {
        if (!isFirst || includeFirst) {
            yield [prev, item];
        }
        isFirst = false;
        prev = item;
    }
}
//# sourceMappingURL=utils.js.map