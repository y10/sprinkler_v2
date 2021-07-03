import { Router } from "../system/router";
import { Module } from "../system/module";

export class Outlet extends HTMLElement {

    static forRoot(config) {
        class o extends Outlet {
            constructor() {
                super()
                this.router = Router.forRoot(config);
            }
        }

        return o;
    }

    connectedCallback() {
        const outletRoot = this.outletRoot = this.attachShadow({ mode: 'open' });
        const template = document.createElement('template')
        template.innerHTML = `<div id="container"><slot></slot></div>`;
        outletRoot.appendChild(template.content.cloneNode(true));

        const rootElement = this.rootElement = outletRoot.querySelector("#container");
        const slotElement = this.slotElement = outletRoot.querySelector("slot");
        const slotChildren = slotElement.assignedElements();
        this.defaultElement = slotChildren.length > 0 ? slotChildren[0] : null;
        this.lastElement = this.defaultElement;
    }

    async navigate(screen, nohistory = false) {

        const cursorstyle = document.body.style.cursor;
        const rootElement = this.rootElement;
        const lastElement = this.lastElement;
        const from = lastElement ? this.router.screens(lastElement.tagName) : null;
        const to = screen;

        const component = this.router.components(to);

        if (!component) {
            return false;
        }

        if (component.name == lastElement.tagName) {
            return false;
        }

        document.body.style.cursor = 'wait';
        try {

            if (!Module.exists(component.name)) {
                if (!(await Module.load(component.src))) {
                    return false;
                }
            }

            if (this.dispatchEvent(new CustomEvent('navigate-to', { cancelable: true, detail: { to: to, from: from } }))) {
                if (lastElement) {
                    lastElement.style.display = 'none';
                }

                const template = document.createElement('template')
                template.innerHTML = `<${component.name}${nohistory ? ' nohistory' : ''}></${component.name}>`;
                this.rootElement.appendChild(template.content.cloneNode(true));
                this.lastElement = rootElement.children[rootElement.childElementCount - 1];
            }
        } catch (error) {
            console.error(error);
        }

        document.body.style.cursor = cursorstyle;

        return true;
    }

    back() {

        const rootElement = this.rootElement;
        const lastElement = this.lastElement;
        const cursorstyle = document.body.style.cursor;

        if (rootElement.childElementCount > 1) {
            document.body.style.cursor = 'wait';

            let toElement = this.defaultElement;
            if (rootElement.childElementCount > 2) {
                toElement = rootElement.children[rootElement.childElementCount - 2];
            }

            const from = this.router.screens(lastElement.tagName);
            let   to = this.router.screens(toElement.tagName);

            try {
                do {
                    if (!this.lastElement.dispatchEvent(new CustomEvent('navigate-from', { cancelable: true, detail: { to: to, from: from } }))) {
                        break;
                    }
                    const element = this.lastElement;
                    this.lastElement = this.lastElement.previousSibling;
                    to = this.router.screens(this.lastElement.tagName);
                    rootElement.removeChild(element);
                }
                while (this.lastElement.hasAttribute('nohistory'));

                if (this.lastElement == this.slotElement) {
                    this.lastElement = this.defaultElement;
                    to = this.router.screens(this.lastElement.tagName);
                }

                if (this.dispatchEvent(new CustomEvent('navigate-from', { cancelable: true, detail: { to: to, from: from } }))) {
                    this.lastElement.style.display = '';
                }

            } catch (error) {
                console.error(error);
            }
            document.body.style.cursor = cursorstyle;

            return true;
        }

        return false;
    }
}
