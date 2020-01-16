"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Linqish {
    constructor(iter) {
        this.iter = iter;
    }
    map(f) {
        const iter = this.iter;
        return new Linqish((function* () {
            for (const x of iter) {
                yield f(x);
            }
        })());
    }
    takeWhile(f) {
        const iter = this.iter;
        return new Linqish((function* () {
            for (const x of iter) {
                if (f(x) === false)
                    return;
                yield x;
            }
        })());
    }
    zip(iter2) {
        const i1 = this.iter[Symbol.iterator]();
        const i2 = iter2[Symbol.iterator]();
        return new Linqish((function* () {
            while (true) {
                const lResult = i1.next();
                const rResult = i2.next();
                if (lResult.done || rResult.done) {
                    return;
                }
                else {
                    yield [lResult.value, rResult.value];
                }
            }
        })());
    }
    union(iter2) {
        const iter = this.iter;
        return new Linqish((function* () {
            for (const item of iter) {
                yield item;
            }
            for (const item of iter2) {
                yield item;
            }
        })());
    }
    filter(f) {
        const iter = this.iter;
        return new Linqish((function* () {
            for (const x of iter) {
                if (f(x)) {
                    yield x;
                }
            }
        })());
    }
    interleave(iter2) {
        const i1 = this.iter[Symbol.iterator]();
        const i2 = iter2[Symbol.iterator]();
        return new Linqish((function* () {
            let current = i1;
            const swapIterators = () => {
                if (current === i1)
                    current = i2;
                else
                    current = i1;
            };
            while (true) {
                const result = current.next();
                if (result.done) {
                    swapIterators();
                    for (const item of current) {
                        yield item;
                    }
                    return;
                }
                yield result.value;
                swapIterators();
            }
        })());
    }
    fold(f, seed) {
        const iter = this.iter;
        let state = seed;
        for (const x of iter) {
            state = f(x, state);
        }
        return state;
    }
    partition(f) {
        return this.fold((x, state) => {
            (f(x) ? state._true : state._false).push(x);
            return state;
        }, { _true: [], _false: [] });
    }
    toArray() {
        return Array.from(this.iter);
    }
}
function linqish(i) {
    return new Linqish(i);
}
exports.linqish = linqish;
linqish.empty = new Linqish((function* () { })());
//# sourceMappingURL=common.js.map