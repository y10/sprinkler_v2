import { Time } from "../system/time";
import { Zone } from "./zone";

function* ZoneItr(zones) {
    for (const id in zones) {
        yield new Zone(id, zones);
    }
}

export class ZoneSet {

    $zones;
    $currentId;

    constructor(zones) {
        this.$zones = zones;
    }

    [Symbol.iterator]() {
        return ZoneItr(this.$zones)
    }

    get current() {
        return this.$zones[this.$currentId];
    }

    /**
    * 
    * @param {Zone} zone - zone instance
    */
    set current(zone) {
        this.$currentId = zone ? zone.id : null
    }

    get currentIndex() {
        return Object.keys(this.$zones).findIndex((x => x == this.$currentId));
    }

    count() {
        return Object.keys(this.$zones).length;
    }

    /**
    * 
    * @returns {Zone}     
    */
    zone(id) {
        return new Zone(id, this.$zones);
    }

    /**
    * 
    * @returns {Zone}     
    */
    create(zoneid) {
        const zones = this.$zones;
        const id = zoneid ? zoneid : Object.keys(zones).sort().map(x => parseInt(x)).reduce((id) => id in zones ? ++id : id, 1);
        return new Zone(id, zones[id] = {
            name: "Zone " + id,
            days: {
                "all": [
                    { h: Time.toUtcHour(0) }
                ]
            }
        });
    }

    remove(zoneid) {

        const zones = this.$zones;

        if (this.count() > 1) {
            delete zones[zoneid]
        }

        return this.count();
    }

    /**
    * 
    * @returns {Zone}     
    */
    last() {

        const zones = this.$zones;
        const keys = Object.keys(zones);
        const id = keys[keys.length - 1];
        return (id) ? new Zone(id, this.$zones) : null;
    }

    toJson() {
        return { ...this.$zones };
    }
}