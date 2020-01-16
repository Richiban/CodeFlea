export type DirectionOrNearest = Direction | "nearest";

export type Change = "greaterThan" | "lessThan";

export type Direction = "forwards" | "backwards";

export type JumpLocations = {
  locations: JumpLocation[];
  focusLine: number;
};

export type JumpLocation = {
  jumpCode: string;
  lineNumber: number;
  charIndex: number;
};

class Linqish<T> {
  constructor(private iter: Iterable<T>) {}

  map<R>(f: (x: T) => R): Linqish<R> {
    const iter = this.iter;

    return new Linqish(
      (function*() {
        for (const x of iter) {
          yield f(x);
        }
      })()
    );
  }

  takeWhile(f: (x: T) => boolean): Linqish<T> {
    const iter = this.iter;

    return new Linqish(
      (function*() {
        for (const x of iter) {
          if (f(x) === false) return;

          yield x;
        }
      })()
    );
  }

  zip<T2>(iter2: Iterable<T2>) {
    const i1 = this.iter[Symbol.iterator]();
    const i2 = iter2[Symbol.iterator]();

    return new Linqish(
      (function*() {
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

  union(iter2: Iterable<T>) {
    const iter = this.iter;

    return new Linqish(
      (function*() {
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
      (function*() {
        for (const x of iter) {
          if (f(x)) {
            yield x;
          }
        }
      })()
    );
  }

  interleave(iter2: Iterable<T>) {
    const i1 = this.iter[Symbol.iterator]();
    const i2 = iter2[Symbol.iterator]();

    return new Linqish(
      (function*() {
        let current = i1;

        const swapIterators = () => {
          if (current === i1) current = i2;
          else current = i1;
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

linqish.empty = new Linqish((function*() {})());
