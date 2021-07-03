import { Time } from "../system/time";
import { TimerSet } from "./timerSet";
import { Timer } from "./timer";

export class Weekday {

    $day;
    $name;
    $timers;

    constructor(name, days) {
        this.$name = name;
        this.$day = (name in days) ? days[name] : days[name] = [{ h: Time.toUtcHour(0) }];
        this.$timers = new TimerSet(this.$day);
    }

    get name() {
        return this.$name;
    }

    /**
    * @param {number} index - Timer at index to return;
    * @returns {Timer}
    */
    timers(index) {
        if (index === undefined) {
            return this.$timers;
        }

        return this.$timers.timer(index);
    }
}