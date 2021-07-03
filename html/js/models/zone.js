import { Weekday } from "./weekday";

export class Zone {

    $id;
    $zones;

    constructor(id, zones) {
        this.$id = id;
        this.$zones = zones;
    }

    get id() {
        return this.$id;
    }

    get name() {
        const zone = this.$zones[this.$id];
        return zone ? zone.name : "";
    }

    set name(name) {
        const zone = this.$zones[this.$id];
        (zone) ? (zone.name = name) : this.$zones[this.$id] = { name }
    }

    /**
    * 
    * @returns {Weekday}     
    */
    days(name) {
        const zone = this.$zones[this.$id];
        return new Weekday(name, zone.days);
    }

    remove() {
        const zones = this.$zones;
        if (Object.keys(zones).length > 1) {
            delete zones[this.$id]
        }
        return Object.keys(zones).length;
    }

    defined() {
        return this.$id in this.$zones;
    }

    toJson() {
        const id = this.$id;
        const zone = this.$zones[id];
        return { id, ...zone };
    }
}
