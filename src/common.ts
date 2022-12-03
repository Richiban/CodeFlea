import { Config } from "./config";
import * as vscode from "vscode";

export type DirectionOrNearest = Direction | "nearest";

export type Change = "greaterThan" | "lessThan";

export type Direction = "forwards" | "backwards";

export type RelativeIndentation =
    | "more-indentation"
    | "less-indentation"
    | "same-indentation"
    | "no-indentation";

export type IndentationRequest =
    | RelativeIndentation
    | "same-indentation-current-scope"
    | "any-indentation";

export type JumpLocations = JumpLocation[];

export type JumpLocation = {
    jumpCode: string;
    position: vscode.Position;
};

export type Parameter<T> = T extends (arg: infer U) => any ? U : never;

export type ExtensionContext = {
    statusBar: vscode.StatusBarItem;
    config: Config;
    editor: vscode.TextEditor;
};

export type Char = string & { length: 1 };

export function opposite(direction: Direction) {
    return direction === "forwards" ? "backwards" : "forwards";
}

export function getJumpCodes(config: Config) {
    return config.jump.characters.split(/[\s,]+/);
}

export function directionToDelta(direction: Direction) {
    return direction === "forwards"
        ? (x: number) => x + 1
        : (x: number) => x - 1;
}

export class Cache<TArgs extends any[], TValue> implements Iterable<TValue> {
    private _cache: Record<string, TValue> = {};

    constructor(
        private generateValue: (...key: TArgs) => TValue,
        private getCacheKey: (...args: TArgs) => string
    ) {}

    get(...args: TArgs): TValue {
        const cacheKey = this.getCacheKey(...args);

        if (!(cacheKey in this._cache)) {
            this._cache[cacheKey] = this.generateValue(...args);
        }

        return this._cache[cacheKey];
    }

    reset() {
        this._cache = {};
    }

    *[Symbol.iterator](): Iterator<TValue> {
        for (const key in this._cache) {
            yield this._cache[key];
        }
    }
}

export class Linqish<T> implements Iterable<T> {
    constructor(private iter: Iterable<T>) {}

    [Symbol.iterator](): Iterator<T, any, undefined> {
        return this.iter[Symbol.iterator]();
    }

    tryElementAt(number: number): T | undefined {
        return this.skip(number).tryFirst();
    }

    counted(): Linqish<readonly [T, number]> {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                let count = 0;
                for (const item of iter) {
                    yield [item, count] as const;
                    count++;
                }
            })()
        );
    }

    minBy(selector: (item: T) => number): T | undefined {
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

    skip(numToSkip: number): Linqish<T> {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                let skipped = 0;

                for (const x of iter) {
                    if (skipped < numToSkip) {
                        skipped++;
                    } else {
                        yield x;
                    }
                }
            })()
        );
    }

    take(count: number): Linqish<T> {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                let numRemaining = Math.max(0, count);

                for (const x of iter) {
                    if (numRemaining <= 0) {
                        return;
                    }

                    numRemaining--;

                    yield x;
                }
            })()
        );
    }

    pairwise(): Linqish<[undefined, T] | [T, undefined] | [T, T]> {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                const iterator = iter[Symbol.iterator]();

                let r = iterator.next();
                let prev = r.value;

                while (!r.done) {
                    yield [prev, r.value] as [T, T];
                    prev = r.value;

                    r = iterator.next();
                }
            })()
        );
    }

    map<R>(f: (x: T) => R): Linqish<R> {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                for (const x of iter) {
                    yield f(x);
                }
            })()
        );
    }

    takeWhile(f: (x: T) => boolean): Linqish<T> {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                for (const x of iter) {
                    if (f(x) === false) {
                        return;
                    }

                    yield x;
                }
            })()
        );
    }

    zipWith<T2>(iter2: Iterable<T2>): Linqish<readonly [T, T2]> {
        const i1 = this.iter[Symbol.iterator]();
        const i2 = iter2[Symbol.iterator]();

        return new Linqish(
            (function* () {
                while (true) {
                    const lResult = i1.next();
                    const rResult = i2.next();

                    if (lResult.done || rResult.done) {
                        return;
                    } else {
                        yield [lResult.value, rResult.value] as const;
                    }
                }
            })()
        );
    }

    concat(iter2: Iterable<T>) {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                for (const item of iter) {
                    yield item;
                }
                for (const item of iter2) {
                    yield item;
                }
            })()
        );
    }

    filter(f: (x: T) => boolean) {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                for (const x of iter) {
                    if (f(x)) {
                        yield x;
                    }
                }
            })()
        );
    }

    filterMap<R>(f: (x: T) => R | undefined) {
        const iter = this.iter;

        return new Linqish(
            (function* () {
                for (const x of iter) {
                    const r = f(x);
                    if (r !== undefined) {
                        yield r;
                    }
                }
            })()
        );
    }

    alternateWith<U>(iter2: Iterable<U>): Linqish<T | U> {
        const i1 = this.iter[Symbol.iterator]();
        const i2 = iter2[Symbol.iterator]();

        return new Linqish(
            (function* () {
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
            })()
        );
    }

    fold<State>(f: (x: T, state: State) => State, seed: State) {
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

    tryLast(): T | undefined {
        let result = undefined;

        for (const x of this.iter) {
            result = x;
        }

        return result;
    }
}

export function linqish<T>(i: Iterable<T>) {
    return new Linqish(i);
}

linqish.empty = new Linqish((function* () {})());
