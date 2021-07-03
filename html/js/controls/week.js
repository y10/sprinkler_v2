import { jQuery } from "../system/jquery";

const WEEK_ALL = "all";
const WEEK_SUN = "sun";
const WEEK_MON = "mon";
const WEEK_TUE = "tue";
const WEEK_WED = "wed";
const WEEK_THU = "thu";
const WEEK_FRI = "fri";
const WEEK_SAT = "sat";

export const WEEK_DAYS = [WEEK_ALL, WEEK_SUN, WEEK_MON, WEEK_TUE, WEEK_WED, WEEK_THU, WEEK_FRI, WEEK_SAT]
export const WEEK_DAY_TO_INDEX = { all: 0, sun: 1, mon: 2, tue: 3, wed: 4, thu: 5, fri: 6, sat: 7 }

const template = `
<style>
ul {
    align-items: center;
    justify-content: center;
    position: absolute;
    display: flex;
    list-style: none;
    font-size: 32px;
    padding: 0;
    width: 100%;
    color: var(--primary-text-color);
}
li {
    width: 48px;
    height: 40px;
    line-height: 40px;
    text-align: center;
}
.selected {
    border-radius: 100%;
    background-color: var(--secondary-background-color);
    color: var(--secondary-text-color);
}
.enabled {
    color: var(--info-background-color, rgb(65, 184, 131));
}

.selected.enabled {
    border-radius: 100%;
    background-color: var(--info-background-color, rgb(65, 184, 131));
    color: var(--secondary-text-color);
}

</style>
<ul></ul>`
export class Week extends HTMLElement {

    connectedCallback() {
        this.value = this.getAttribute("value");
        this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
            this.Ul = $('ul');
        });

        ["S", "M", "T", "W", "T", "F", "S"].forEach((day, i) => {
            this.Ul.append(`<li ${(i + 1 == WEEK_DAY_TO_INDEX[this.value]) ? "class='selected'" : ""}>${day}</li>`)
        });

        this.Ul.on('click', this.onClick.bind(this));
    }

    disconnectedCallback() {
        this.jQuery().detach();
    }

    onClick(e) {
        const ul = this.Ul.item();
        if (ul !== e.srcElement) {
            for (let i = 0; i < ul.children.length; i++) {
                const child = ul.children[i];
                if (child === e.srcElement) {
                    this.onSelect(i);
                    break;
                }
            }
        }
    }

    onSelect(index) {
        const ul = this.Ul.item();
        const li = ul.children[index];
        if (this.jQuery(li).hasClass("selected") == false) {
            this.jQuery("li").removeClass("selected");
            this.jQuery(li).addClass("selected");
            this.dispatchEvent(new CustomEvent('change', { detail: { day: WEEK_DAYS[index + 1] } }));
        }
        else {
            this.jQuery("li").removeClass("selected");
            this.dispatchEvent(new CustomEvent('change', { detail: { day: WEEK_DAYS[0] } }));
        }
    }
}