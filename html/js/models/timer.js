import { Time } from "../system/time";

export class Timer {
    $timers;
    $index;

    constructor(index, timers) {
        this.$timers = timers;
        this.$index = index;
    }

    get i() {
        return this.$index;
    }

    get h() {
        const day = this.$timers[this.$index];
        return day ? Time.toLocalHour(day.h) : 0;
    }

    set h(h) {

        const index = this.$index;
        const day = this.$timers[index];
        h = Time.toUtcHour(h);
        (day)
            ? this.$timers[index] = { ...day, h }
            : this.$timers[index] = { h }
    }

    get m() {
        const day = this.$timers[this.$index];
        return day ? day.m : 0
    }

    set m(m) {
        const index = this.$index;
        const day = this.$timers[index];
        (day)
            ? this.$timers[index] = { ...day, m }
            : this.$timers[index] = { m }
    }

    get d() {
        const day = this.$timers[this.$index];
        return day ? day.d : 0
    }

    set d(d) {
        const index = this.$index;
        const day = this.$timers[index];
        (day)
            ? this.$timers[index] = { ...day, d }
            : this.$timers[index] = { d }
    }

    remove() {
        this.$timers.splice(this.$index);
    }
}