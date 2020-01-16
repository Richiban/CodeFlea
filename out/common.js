"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Linqish {
    constructor(iter) {
        this.iter = iter;
    }
    [Symbol.iterator]() {
        return this.iter[Symbol.iterator]();
    }
    pairwise() {
        const iter = this.iter;
        return new Linqish((function* () {
            const iterator = iter[Symbol.iterator]();
            let r = iterator.next();
            let prev = r.value;
            while (!r.done) {
                yield [prev, r.value];
                prev = r.value;
                r = iterator.next();
            }
        })());
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
    zipWith(iter2) {
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
            let currentIterator = i1;
            const swapIterators = () => {
                if (currentIterator === i1)
                    currentIterator = i2;
                else
                    currentIterator = i1;
            };
            while (true) {
                const result = currentIterator.next();
                if (result.done) {
                    swapIterators();
                    let { value, done } = currentIterator.next();
                    while (!done) {
                        yield value;
                        ({ value, done } = currentIterator.next());
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