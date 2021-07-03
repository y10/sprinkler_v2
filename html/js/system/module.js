import { Http } from './http'
import { Status } from './status'
import { Version } from '../config'

function jQuery(e) { return document.getElementById(e); }

export class Module {

    static register(modules) {
        for (const module in modules) {
            const name = module.toLowerCase();
            if (window.customElements.get(name) !== undefined) {
                console.warn('Module: ' + name + ' has been already defined.')
                continue;
            }
            window.customElements.define(name, modules[module]);
        }
    }

    static exists(module) {
        return window.customElements.get(module.toLowerCase()) !== undefined;
    }

    static async load(src) {
        Status.spinning = true;
        try {
            await Http.import(src + "?" + Version.toString());
            Status.spinning = false;
        } catch (error) {
            Status.spinning = false;
            console.error(error);
            return false;
        }

        return true;
    }

    /**
     * jQuery in the scope of web component
     * 
     * @param {function({jQuery})} onStart - a function.
    */
    static start(onStart) {
        onStart(jQuery);
    }
}