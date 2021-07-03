import { jQuery } from "../system/jquery";

const template = (self) => `
<style>
.menu {
    line-height: 0;
    display: inline-block;
    position: fixed;
    z-index: 10;
    top: 15px;
    right: 20px;
    cursor: pointer;
    color: var(--primary-text-color);
    transition: all 0.66s ease;
    -webkit-transition: all 0.66s ease;
}

.bar1,
.bar2,
.bar3 {
    width: 35px;
    height: 5px;
    background-color: var(--secondary-background-color);
    margin: 6px 0;
    transition: 0.4s;
}

.opened .bar1 {
    -webkit-transform: rotate(-45deg) translate(-9px, 6px);
    transform: rotate(-45deg) translate(-9px, 6px);
}
.opened .bar2 {
    opacity: 0;
}
.opened .bar3 {
    -webkit-transform: rotate(45deg) translate(-8px, -8px);
    transform: rotate(45deg) translate(-8px, -8px);
}
</style>
<div id="menu" class="menu${self.opened ? ' opened' : ''}">
    <div class="bar1"></div>
    <div class="bar2"></div>
    <div class="bar3"></div>
</div>
`;

export class MenuToggle extends HTMLElement {

    #opened = false;

    connectedCallback() {
        this.#opened = this.hasAttribute("opened")
        this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
            this.Btn = $('#menu');
        });
    }

    get opened() {
        return this.#opened;
    }

    set opened(value) {
        (value) ? this.open() : this.close()
    }

    open() {
        this.Btn.addClass('opened');
        this.#opened = true;
    }

    close() {
        this.Btn.removeClass('opened');
        this.#opened = false;
    }
}