import { Wsc } from "./wsc";
import { Http } from "./http";

function* LogItr(logs) {
    for (let i = logs.length - 1; i >=0 ; i--) {
        yield logs[i];
    }
}

class EventLog {

    #log = [];

    [Symbol.iterator]() {
        return LogItr(this.#log)
    }

    subscribe() {
        Wsc.on('event', this.onEvent, this);
    }

    unsubscribe() {
        Wsc.off('event', this.onEvent);
    }

    empty() {
        return this.#log.length == 0;
    }

    clear() {
        this.#log = [];
    }

    async fetch() {
        this.#log = [];
        const logs = await Http.json('GET', 'esp/log');
        for (const log of logs) {
            this.onEvent(log);
        }
        return this.#log;
    }

    loglevel(level) {
        var data = new FormData();
        data.append("level", level);
        return Http.postForm('esp/logLevel', data)
    }

    onEvent(e) {
        if (e) {
            
            let log = null;
            if (e.info) {
                log = { level: "info", scope: e.scope, log: e.info };
            } else if (e.warn) {
                log = { level: "warn", scope: e.scope, log: e.warn };
            } else if (e.error) {
                log = { level: "error", scope: e.scope, log: e.error };
            }

            if (log) {
                this.#log.push(log);
                document.dispatchEvent(new CustomEvent('sketch-event', { detail: log }));
            }
        }
    }
}

let log = new EventLog();

if (window.eventLog === undefined) {
    log.subscribe();
    console.log("Subscribed to EventLog");
    window.eventLog = log;
}
else {
    log = window.eventLog;
}

export const Log = log;