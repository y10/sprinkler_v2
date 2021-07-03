import { Timer } from "./timer";

function* TimerItr(timers) {
    for (let i = 0; i < timers.length; i++) {
        yield new Timer(i, timers);
    }
}

export class TimerSet {

    $timers;

    constructor(timers) {
        this.$timers = timers;
    }

    [Symbol.iterator]() {
        return TimerItr(this.$timers)
    }

    count() {
        return this.$timers.length;
    }

    /**
    * 
    * @returns {Timer}     
    */
    timer(index) {
        if (index > this.count() - 1)
            throw("Out of range of created timers");

        return new Timer(index, this.$timers);
    }
}