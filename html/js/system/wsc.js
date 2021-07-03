/**
 * @callback OnComplete
 * @param {function(state:{})} onComplete to call on success
 */

export class WsClient {
    Events = {};

    /**
     * @param {string} event name
     * @param {OnComplete} onComplete
     * @param {object} context this
     * @returns {WsClient}     
     */
    on(event, onComplete, context) {
        if (onComplete) {
            if (!(event in this.Events)) {
                this.Events[event] = [];
            }
            this.Events[event].push({ onComplete, context });
        }

        return this
    }

    /**
    * @param {string} event name
    * @param {OnComplete} onComplete
    * @returns {WsClient}     
    */
    off(event, onComplete) {
        if (onComplete) {
            if (event in this.Events) {
                const events = this.Events[event];
                let index = -1;
                let i = 0;
                for (const reg of events) {
                    if (reg.onComplete === onComplete) {
                        index = i;
                        break;
                    }
                    i++;
                }
                if (index > -1) {
                    events.splice(index, 1);
                }
            }
        }

        return this;
    }

    connect() {

        self = this;

        function reconnect() {
            if (!self.connect()) {
                setTimeout(() => {
                    reconnect();
                }, 5000);
            }
        }

        function fireEvent(name, event) {
            if (name in self.Events) {
                self.Events[name].forEach(({ onComplete, context }) => {
                    onComplete.call(context, event);
                });
            }
        }

        try {
            const ws = new WebSocket('ws://' + window.location.hostname + '/ws');
            ws.onopen = function (evt) {
                console.log('WS: open');
                fireEvent('connected');
            };
            ws.onclose = function (evt) {
                console.warn('WS: close');
                fireEvent('disconnect');
                reconnect();
            };
            ws.onerror = function (evt) {
                console.error("WS: error");
                console.error(evt);
            };
            ws.onmessage = function (evt) {
                try {
                    const e = evt.data ? JSON.parse(evt.data) : {}
                    const type = Object.keys(e)[0];
                    console.log(e);
                    fireEvent(type, e[type]); 
                } catch (error) {
                    console.error(error);
                    console.log(evt.data);
                }
            };

            return ws;

        } catch (error) {
            console.error("WS: not available");
            console.error(error);
        }

        return null;
    }
}

let wsc = new WsClient();

if (window.wsc === undefined) {
    if (window.location.hostname) {
        wsc.connect();
    }

    window.wsc = wsc;
}
else {
    wsc = window.wsc;
}

export const Wsc = wsc;