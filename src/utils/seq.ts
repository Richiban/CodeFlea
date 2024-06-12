export default class Seq<out T> implements Iterable<T> {
    constructor(private iter: Iterable<T>) {}

    [Symbol.iterator](): Iterator<T, any, undefined> {
        return this.iter[Symbol.iterator]();
    }

    tryElementAt(number: number): T | undefined {
        return this.skip(number).tryFirst();
    }

    counted(): Seq<readonly [T, number]> {
        const iter = this.iter;

        return seq(function* () {
            let count = 0;
            for (const item of iter) {
                yield [item, count] as const;
                count++;
            }
        });
    }

    tryMinBy(selector: (item: T) => number): T | undefined {
        const iter = this.iter;

        let currentBestItem = undefined;
        let currentBestSelect = undefined;

        for (const item of iter) {
            const currentSelect = selector(item);
            if (
                currentBestSelect === undefined ||
                currentBestSelect > currentSelect
            ) {
                currentBestSelect = currentSelect;
                currentBestItem = item;
            }
        }

        return currentBestItem;
    }

    skip(numToSkip: number): Seq<T> {
        const iter = this.iter;

        return seq(function* () {
            let skipped = 0;

            for (const x of iter) {
                if (skipped < numToSkip) {
                    skipped++;
                } else {
                    yield x;
                }
            }
        });
    }

    take(count: number): Seq<T> {
        const iter = this.iter;

        return seq(function* () {
            let numRemaining = Math.max(0, count);

            for (const x of iter) {
                if (numRemaining <= 0) {
                    return;
                }

                numRemaining--;

                yield x;
            }
        });
    }

    pairwise(): Seq<readonly [T, T]> {
        const iter = this.iter;

        return seq(function* () {
            let previous = undefined;

            for (const current of iter) {
                if (previous !== undefined) {
                    yield [previous, current] as const;
                }

                previous = current;
            }
        });
    }

    map<R>(f: (x: T) => R): Seq<R> {
        const iter = this.iter;

        return seq(function* () {
            for (const x of iter) {
                yield f(x);
            }
        });
    }

    flatMap<R, U extends Iterable<R>>(f: (x: T) => U) {
        const iter = this.iter;

        return seq(function* () {
            for (const x of iter) {
                yield* f(x);
            }
        });
    }

    takeWhile(f: (x: T) => boolean): Seq<T> {
        const iter = this.iter;

        return seq(function* () {
            for (const x of iter) {
                if (f(x) === false) {
                    return;
                }

                yield x;
            }
        });
    }

    zipWith<T2>(iter2: Iterable<T2>): Seq<readonly [T, T2]> {
        const i1 = this.iter[Symbol.iterator]();
        const i2 = iter2[Symbol.iterator]();

        return seq(function* () {
            while (true) {
                const lResult = i1.next();
                const rResult = i2.next();

                if (lResult.done || rResult.done) {
                    return;
                }

                yield [lResult.value, rResult.value] as const;
            }
        });
    }

    concat(iter2: Iterable<T>) {
        const iter = this.iter;

        return seq(function* () {
            for (const item of iter) {
                yield item;
            }

            for (const item of iter2) {
                yield item;
            }
        });
    }

    filter(f: (x: T) => boolean) {
        const iter = this.iter;

        return seq(function* () {
            for (const x of iter) {
                if (f(x)) {
                    yield x;
                }
            }
        });
    }

    filterUndefined() {
        return this.filterMap((x) => x);
    }

    filterMap<R>(f: (x: T) => R | undefined) {
        const iter = this.iter;

        return seq(function* () {
            for (const x of iter) {
                const r = f(x);
                if (r !== undefined) {
                    yield r;
                }
            }
        });
    }

    alternateWith<U>(iter2: Iterable<U>): Seq<T | U> {
        const i1 = this.iter[Symbol.iterator]();
        const i2 = iter2[Symbol.iterator]();

        return seq(function* () {
            let currentIterator: Iterator<T | U> = i1;

            const swapIterators = () => {
                if (currentIterator === i1) {
                    currentIterator = i2;
                } else {
                    currentIterator = i1;
                }
            };

            while (true) {
                const result = currentIterator.next();

                if (result.done) {
                    swapIterators();

                    let { value, done } = currentIterator.next();

                    while (!done) {
                        yield value;
                        const r = currentIterator.next();
                        value = r.value;
                        done = r.done;
                    }

                    return;
                }

                yield result.value;

                swapIterators();
            }
        });
    }

    scan<State>(f: (x: T, y: State) => State, seed: State): Seq<State> {
        const iter = this.iter;

        return seq(function* () {
            let result = seed;

            for (const x of iter) {
                result = f(x, result);
                yield result;
            }
        });
    }

    fold<State>(f: (x: T, state: State) => State, seed: State): State {
        const iter = this.iter;

        let state = seed;

        for (const x of iter) {
            state = f(x, state);
        }

        return state;
    }

    partition(f: (x: T) => boolean) {
        return this.fold(
            (x, state) => {
                (f(x) ? state._true : state._false).push(x);

                return state;
            },
            { _true: [] as T[], _false: [] as T[] }
        );
    }

    toArray(): T[] {
        return Array.from(this.iter);
    }

    tryFirst(): T | undefined {
        let result = undefined;

        for (const x of this.iter) {
            result = x;
            break;
        }

        return result;
    }

    find(f: (x: T) => boolean): T | undefined {
        for (const x of this.iter) {
            if (f(x)) {
                return x;
            }
        }

        return undefined;
    }

    findDefined<R>(f: (x: T) => R | undefined): R | undefined {
        for (const x of this.iter) {
            const y = f(x);

            if (y) {
                return y;
            }
        }

        return undefined;
    }

    tryLast(): T | undefined {
        let result = undefined;

        for (const x of this.iter) {
            result = x;
        }

        return result;
    }
}

export function seq<T>(iter: Iterable<T>): Seq<T>;
export function seq<T>(f: () => Iterable<T>): Seq<T>;
export function seq<T>(target: (() => Iterable<T>) | Iterable<T>): Seq<T> {
    if (typeof target === "function") return new Seq(target());
    else return new Seq(target);
}

seq.empty = new Seq([]);
