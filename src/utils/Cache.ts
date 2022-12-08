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
