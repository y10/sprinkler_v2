import { Status } from "../system/status";
import { Time } from "../system/time";
import { Log } from "../system/log";
import { Store } from "../storage";
import { ZoneSet } from "./zoneSet";
import { Zone } from "./zone";

class AppModel {

    $logLevel = "none";

    $friendlyName = "Sprinkler";

    $hostname = "sprinkler-v2";

    $zones = new ZoneSet({
        1: {
            name: "Zone 1",
            days: {
                "all": [
                    { h: Time.toUtcHour(0) }
                ]
            }
        }
    })

    friendlyName(name) {
        if (name !== undefined) {
            this.$friendlyName = name;
        }

        return this.$friendlyName;
    }

    hostname(name) {
        if (name !== undefined) {
            this.$hostname = name;
        }

        return this.$hostname;
    }

    /**
    * @param {string} id - zone id to return;
    * @returns {Zone}
    */
    zones(id) {
        if (id === undefined) {
            return this.$zones
        }

        return this.$zones.zone(id);
    }

    async load() {
        try {
            const state = await Store.get();
            if (state) {
                if ('zones' in state && Object.keys(state.zones).length > 0) {
                    this.$zones = new ZoneSet(state.zones);
                }
                if ('logLevel' in state) {
                    this.$logLevel = state.logLevel;
                }
                if ('name' in state) {
                    this.$friendlyName = state.name;
                }
                if ('chip' in state) {
                    this.$hostname = state.chip;
                }
            }
        } catch (error) {
            console.error("Failed to load zones from storage. " + error);
        }

        return this.zones().count();
    }

    async save() {
        const spinner = Status.wait();
        const logLevel = this.$logLevel;
        const chip = this.$hostname;
        const name = this.$friendlyName;
        const zones = this.$zones.toJson();
        const state = { logLevel, name, chip, zones };
        try {
            const json = await Store.put(state);
            if (json && json !== state) {
                this.$hostname = json.chip;
                this.$friendlyName = json.name;
                if (Object.keys(json["zones"]).length > 0) {
                    this.$zones = new ZoneSet(json.zones);
                }
                return true;
            }
        } catch (error) {
            Status.error(error);
        }

        spinner.close();
        return false;
    }

    /**
    * @param {string} id - zone id to return;
    * @returns {Zone}
    */
    logLevel(level) {
        if (level === undefined) {
            return this.$logLevel;
        }

        return this.loglevelAsync(level);
    }

    async loglevelAsync(level) {
        Status.wait();
        Log.loglevel(level).catch();
        await App.wait(10000);
        this.reload();
    }

    wait(timeout) {
        return new Promise((done) => {
            setTimeout(done, timeout);
        });
    }

    reload() {
        window.location.reload();        
    }
}

let app = new AppModel();

if (window.app !== undefined) {
    app = window.app;
}
else {
    window.app = app;
}

export const App = app;