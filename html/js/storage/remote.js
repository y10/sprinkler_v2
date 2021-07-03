import { Http } from "../system/http";
import { ZoneSet } from "../models/zoneSet";

export class AppStore {

    $state;

    async get() {
        const state = await Http.json("get", "api/settings");
        
        if (Object.keys(state).length > 0) {
            this.$state = JSON.parse(JSON.stringify(state));
            return state;
        }

        return null;
    }

    async put(state) {

        if (JSON.stringify(this.$state) == JSON.stringify(state)) {
            return state;
        }

        const json = await Http.postJson("api/settings", state);
        if (Object.keys(state).length > 0) {
            this.$state = JSON.parse(JSON.stringify(json));
            return json;                
        }

        return null;        
    }
}