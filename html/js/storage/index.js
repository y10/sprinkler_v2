import { AppStore } from "./remote";

let store = new AppStore();

if ('store' in window) {
    store = window.store;
}
else {
    window.store = store;
}

export const Store = store;
