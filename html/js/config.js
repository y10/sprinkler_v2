export const FIRMWARE_URL = "http://ota.voights.net/sprinkler_v2.bin";
export const MAX_ZONES = 6;
export const TIME_LIMIT_DEFAULT = 5 * 60;

export const Version = {
    major:     2,
    minor:     0,
    release:   0,
    build:     0,
    toString(){
        return `${this.major}.${this.minor}.${this.release}` + ((build) ? `.${this.build}` : '')
    },
    toDecimal(){
        return parseInt(`${this.major}${this.minor}${this.release}`) + (this.build * 0.0001);
    }
}