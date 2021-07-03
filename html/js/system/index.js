export * from "./jquery";
export * from "./router";
export * from "./status";
export * from "./http";
export * from "./wsc";

export class String {
    static format00(value) {
        return (value < 10) ? `0${value}` : value;
    }

     /**
     * @param {Array} enumerable - An array to transorm into a string
     * @param {(value:T, index: number) => string[]} func - A transformation function
     */
    static join(enumerable, func) {
        let arr = enumerable;
        if (!Array.isArray(enumerable)) {
            arr = [...enumerable]
        }
        return arr.map(func).join("");
    }
}

