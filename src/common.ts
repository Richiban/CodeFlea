import { Config } from "./config";

export type DirectionOrNearest = Direction | "nearest";

export type Change = "greaterThan" | "lessThan";

export type Direction = "forwards" | "backwards";

export type Indentation =
  | "greater-indentation"
  | "less-indentation"
  | "same-indentation"
  | "any-indentation";

export type JumpLocations = JumpLocation[];

export type JumpLocation = {
  jumpCode: string;
  lineNumber: number;
  charIndex: number;
};

export function getJumpCodes(config: Config) {
  return config.jump.characters.split(/[\s,]+/);
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

  pairwise(): Linqish<[T, T]> {
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
          if (f(x) === false) return;

          yield x;
        }
      })()
    );
  }

  zipWith<T2>(iter2: Iterable<T2>) {
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

  alternateWith<U>(iter2: Iterable<U>): Linqish<T | U> {
    const i1 = this.iter[Symbol.iterator]();
    const i2 = iter2[Symbol.iterator]();

    return new Linqish(
      (function* () {
        let currentIterator: Iterator<T | U> = i1;

        const swapIterators = () => {
          if (currentIterator === i1) currentIterator = i2;
          else currentIterator = i1;
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

  toArray() {
    return Array.from(this.iter);
  }
}

export function linqish<T>(i: Iterable<T>) {
  return new Linqish(i);
}

linqish.empty = new Linqish((function* () {})());
