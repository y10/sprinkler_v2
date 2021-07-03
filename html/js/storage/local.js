import { Version } from "../config";
import { ZoneSet } from "../models/zoneSet";

export class AppStore {

    idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    /**
    * @param {ZoneSet} value A set of zones to set, or null to return existing set
    * @returns {ZoneSet}
    */
    zones(value) {
        return (value !== undefined)
            ? this.putZones(value)
            : this.getZones();
    }

    async getZones() {
        const db = await this.connectDatabase();
        return new Promise((done, error) => {
            const os = db.transaction("zones").objectStore("zones");
            const rq = os.getAll();
            rq.onsuccess = function (e) {
                const rt = e.target.result;
                const rs = {};
                for (const rc of rt) {
                    const { id } = rc;
                    rs[id] = rc;
                }                
                Object.keys(rs).length > 0 
                    ? done(new ZoneSet(rs)) 
                    : done(null);
            };
            rq.onerror = function () {
                error("Failed to retrieve preferences");
            };
        });
    }

    async addZone(zone) {
        const db = await this.connectDatabase();
        const os = db.transaction(["zones"], "readwrite").objectStore("zones");
        os.add(zone);
    }

    async putZone(zone) {
        const db = await this.connectDatabase();
        const os = db.transaction(["zones"], "readwrite").objectStore("zones");
        os.put(zone);
    }

    async putZones(zones) {
        const curr = await this.getZones();
        const db = await this.connectDatabase();
        const os = db.transaction(["zones"], "readwrite").objectStore("zones");
        for (const zone of zones) {
            os.put(zone.toJson());
        }

        for (const i in diff["deleted"]) {
            this.deleteZone(diff.deleted[i]);
        }

        return this.getZones();
    }

    async deleteZone(zone) {
        const id =  typeof zone === 'object' ? zone.id : zone;
        const db = await this.connectDatabase();
        const os = db.transaction(["zones"], "readwrite").objectStore("zones");
        os.delete(id);
    }

    connectDatabase() {
        return new Promise((done, error) => {
            const idbRequest = this.idb.open('sprinkler', Version.toDecimal());
            idbRequest.onupgradeneeded = function (event) {
                var db = event.target.result;
                var os = db.createObjectStore("zones", { keyPath: "id" });
                os.createIndex("name", "name", { unique: false });
                os.transaction.oncomplete = function(txe) {
                    done(db);
                };
            };
            idbRequest.onsuccess = function (e) {
                done(e.target.result);
            };
            idbRequest.onerror = function () {
                error("Failed to connect to IndexDB");
            };
        })
    }
}