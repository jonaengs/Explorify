export {};  // For some reason maybe needed to make this work

declare global {
    interface Map<K, V> {
        update: (k: K, f: (v?: V) => V) => this
    }
    interface DefaultMap<K, V> {
        update: (k: K, f: (v: V) => V) => this
    }
}

Map.prototype.update = function<K, V>(key: K, fn: (v: V) => V) {
    return this.set(key, fn(this.get(key)));
}

export class DefaultMap<K, V> extends Map<K, V> {
    defaultGen: () => V;

    constructor(defaultVal: V, iterable = []) {
        super(iterable);
        
        // returns value itself if primitive, a new object if object
        this.defaultGen = defaultVal === Object(defaultVal) ?  // @ts-ignore
            () => new defaultVal.constructor()
            : () => defaultVal;
    }

    get(k: K): V {
        return super.get(k) || this.defaultGen();
    }
}

DefaultMap.prototype.update = function<K, V>(k: K, f: (v: V) => V) {
    return this.set(k, f(this.get(k)));
}