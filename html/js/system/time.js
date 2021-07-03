export class Time {

    static timezone() {
        return new Date().getTimezoneOffset() / 60;
    }

    /**
    * @param {date} date utc date
    * @returns {date}
    */
    static toLocal(date) {
        const d = (date instanceof Date) ? date : new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), d.getDay(), d.getHours(), d.getMinutes() + d.getTimezoneOffset());
    }

    /**
    * @param {date} date local date
    * @returns {date}
    */
    static toUtc(date) {
        const d = (date instanceof Date) ? date : new Date(date);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDay(), d.getHours(), d.getMinutes()))
    }

    /**
   * @param {number} hour utc date
   * @returns {number}
   */
    static toLocalHour(hour) {
        const now = new Date();
        now.setHours(hour);
        now.setMinutes(-now.getTimezoneOffset());
        return now.getHours();
    }

    /**
    * @param {number} hour local date
    * @returns {number}
    */
    static toUtcHour(hour) {
        const now = new Date();
        now.setHours(hour);
        now.setMinutes(now.getTimezoneOffset());
        return now.getHours();
    }

    /**
    * @param {number} ms miliseconds
    * @returns {{h, m, s}}
    */
    static toTime(ms) {
        var seconds = ms / 1000;
        var hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
        seconds = seconds % 3600; // seconds remaining after extracting hours
        var minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
        seconds = parseInt(seconds % 60);
        return { h: hours, minutes: minutes, s: seconds };
    }
}