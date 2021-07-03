/**
 * This callback type is called `requestCallback` and is displayed as a global symbol.
 *
 * @callback XQueryCallback
 * @param {function(query):XQuerySelector} $ query selector in the scope of web component
 */

/**
 * This callback type is called `requestCallback` and is displayed as a global symbol.
 *
 * @callback TemplateCallback
 * @param {HTMLElement} self a web component to render
 */

export class XQuerySelector {
    /**
    * @type {XQueryDocument}
    */
    #scope;

    /**
    * @type {[{event, handler, element}]}
    */
    #elements;

    constructor(scope, elements) {
        this.#scope = scope;
        this.#elements = elements;
    }
    /**
     * @returns {XQuerySelector}     
     */
    item(i) {
        return this.#elements[i || 0];
    }

    /**
    * @param {function (value, index)} callbackf - a function walk through elements.
    * @returns {XQuerySelector}     
    */
    forEach(callbackfn) {
        this.#elements.forEach(callbackfn);
        return this;
    }

    /**
    * @param {function (value)} callbackf - a function walk through elements.
    * @returns {XQuerySelector}     
    */
    any(callbackfn) {
        for (const x of this.#elements) {
            if (callbackfn(x)){
                return true;
            }
        }
        return false;
    }

    /**
     * @returns {XQuerySelector}     
     */
    addClass(name) {
        this.#elements.forEach(x => {
            x.classList.add(name);
        });
        return this;
    }
    /**
     * @returns {XQuerySelector}     
     */
    removeClass(name) {
        this.#elements.forEach(x => {
            x.classList.remove(name);
        });
        return this;
    }
    /**
     * @returns {XQuerySelector}     
     */
    hasClass(name) {
        return this.any(x => x.classList.contains(name));
    }

    isAttached() {
        return this.any(x => x.offsetParent !== null);
    }

    inViewport() {
        return this.any(x => {
            const rect = x.getBoundingClientRect();
            return (
                Math.round(rect.top) >= 0 &&
                Math.round(rect.left) >= 0 &&
                Math.round(rect.bottom) <= (window.innerHeight || document.documentElement.clientHeight) &&
                Math.round(rect.right) <= (window.innerWidth || document.documentElement.clientWidth)
            );
        });
    }

    /**
     * @returns {XQuerySelector}     
     */
    css(name, value) {
        this.#elements.forEach(x => {
            x.style[name] = value;
        });
        return this;
    }
  
    /**
     * @returns {XQuerySelector}     
     */
    attr(name, value) {
        this.#elements.forEach(x => {
            x.setAttribute(name, value);
        });
        return this;
    }
    /**
     * @returns {XQuerySelector}     
     */
    text(value) {
        this.#elements.forEach(x => {
            x.innerText = value;
        });
        return this;
    }
    /**
     * @returns {XQuerySelector}     
     */
    value(value) {
        if (value !== undefined) {
            this.#elements.forEach(x => {
                x.value = value;
            });

            return this;
        } else {
            return this.item().value;
        }
    }

    /**
    * @param {TemplateCallback} template - a function returning an html template, with single parameter of the component itself.
    * @param {XQueryCallback} onComplete - a calback function called after template is attached.
    * @returns {function(query):XQuerySelector} jQuery in the scope of web component
    */
    html(input, onComplete) {

        if (input) {

            this.#elements.forEach(x => {
                x.innerHTML = (typeof input === 'function') ? input(x) : input;
            });

            if (onComplete) {
                onComplete(XQuery(this.#scope.document));
            }
        }

        return this;
    }


    /**
     * @returns {XQuerySelector}     
     */
    append(content) {
        const template = document.createElement('template')
        template.innerHTML = content;
        this.#elements.forEach(x => {
            x.appendChild(template.content.cloneNode(true));
        });
        return this;
    }

    /**
    * @returns {XQuerySelector}     
    */
    insert(content) {
        const template = document.createElement('template')
        template.innerHTML = content;
        template.childElementCount
        this.#elements.forEach(x => {
            (x.childElementCount == 0)
                ? x.appendChild(template.content.cloneNode(true))
                : x.insertBefore(template.content.cloneNode(true), x.childNodes[0]);
        });
        return this;
    }

    /**
     * @returns {XQuerySelector}     
     */
    on(event, handler) {
        this.#elements.forEach(x => {
            this.#scope.addEventListener(event, handler, x);
        });
        return this;
    }

    /**
    * @returns {XQuerySelector}     
    */
    onTouchClick(handler) {
        this.#elements.forEach(x => {
            let clicks = 0;
            let timer;
            let latesttap;
            let touchmove;
            x.addEventListener('touchstart', (e) => {
                latesttap = new Date().getTime();
            })
            x.addEventListener('touchmove', (e) => {
                touchmove = true;
            })
            x.addEventListener('touchend', (e) => {
                if (touchmove) {
                    touchmove = false;
                    return false;
                }

                clicks++;
                if (clicks === 1) {
                    timer = setTimeout(function () {
                        e.clicks = 1
                        e.ticks = new Date().getTime() - latesttap;
                        clicks = 0;
                        handler(e);
                        e.preventDefault();
                    }, 400);
                } else if (clicks > 1) {
                    clearTimeout(timer);
                    e.clicks = clicks;
                    e.ticks = new Date().getTime() - latesttap;
                    clicks = 0;
                    handler(e);
                    e.preventDefault();
                }
            });
        });

        return this;
    }

    /**
     * @returns {XQuerySelector}     
     */
    onMouseClick(handler) {

        this.#elements.forEach(x => {
            let clicks = 0;
            let timer;
            let latesttap;
            let mousemove;
            x.addEventListener('mousedown', (e) => {
                latesttap = new Date().getTime();
            })
            x.addEventListener('click', (e) => {
                clicks++;
                if (clicks === 1) {
                    timer = setTimeout(function () {
                        e.ticks = new Date().getTime() - latesttap;
                        e.clicks = 1
                        clicks = 0;
                        handler(e);
                        e.preventDefault();
                    }, 400);
                } else if (clicks > 1) {
                    clearTimeout(timer);
                    e.ticks = new Date().getTime() - latesttap;
                    e.clicks = clicks;
                    clicks = 0;
                    handler(e);
                    e.preventDefault();
                }
            });
        });

        return this;
    }

    /**
    * @returns {XQuerySelector}     
    */
    onClick(handler) {
        if ('ontouchstart' in window) {
            this.onTouchClick(handler);
        } else {
            this.onMouseClick(handler);
        }
    }

    /**
     * @param {TemplateCallback} template - a function returning an html template, with single parameter of the component itself.
     * @param {XQueryCallback} onAttached - a calback function called after template is attached.
     * @returns {function(query):XQuerySelector} jQuery in the scope of web component
     */
    attachShadowTemplate(template, onAttached, config = { mode: 'open' }) {
        const shadowRoot = this.#elements[0].attachShadow(config);
        const $ = XQuery(shadowRoot);

        if (template) {
            if (typeof template === 'function') {
                $().html(template(this.#elements[0]));
            } else {
                $().html(template);
            }
        }

        if (onAttached) {
            onAttached($)
        }

        return $;
    }

    /**
     * @param {XQueryCallback} onAttached - a calback function called after template is attached.
     * @returns {function(query):XQuerySelector} jQuery in the scope of web component
    */
    attachShadow(onAttached, config = { mode: 'open' }) {
        const shadowRoot = this.#elements[0].attachShadow(config);
        const $ = XQuery(shadowRoot);

        if (onAttached) {
            onAttached($)
        }

        return $;
    }

    detach() {
        this.#scope.detach();
    }
};

class XQueryDocument {

    #events;
    #document;

    constructor(doc) {
        this.#events = [];
        this.#document = doc;
    }

    get document() {
        return this.#document;
    }

    query(selector)
    {
        return (typeof selector === 'string')
            ? this.document.querySelectorAll(selector)
            : [selector || this.document];
    }

    addEventListener(event, handler, element) {
        this.#events.push({ event, handler, element });
        element.addEventListener(event, handler);
    }

    detach() {
        this.#events.forEach((x) => {
            const { event, element, handler } = x;
            element.removeEventListener(event, handler);
        });
    }
}

/**
 * @returns {function(doc):XQuerySelector}     
 */
 function XQuery(doc) {

    const scope = new XQueryDocument(doc);

    return (selector) => {
        return new XQuerySelector(scope, scope.query(selector));
    }
}

export const jQuery = XQuery(window.document);