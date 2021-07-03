import { jQuery } from "../system/jquery";

const template = (self) => `
<style>
.menu {
    position: fixed;
    bottom: 30px;
    left: 50%;
    margin-left: -0.5rem;
}

.chevron {
    transform: scale(3);
    color: var(--primary-text-color);
    transition: all 0.66s ease;
}

.opened {
    transform: scale(-3);
}

</style>
<div class="menu">
    <svg class="chevron" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16">
        <g fill="currentColor">
            <path fill-rule="evenodd" d="M7.776 5.553a.5.5 0 0 1 .448 0l6 3a.5.5 0 1 1-.448.894L8 6.56L2.224 9.447a.5.5 0 1 1-.448-.894l6-3z"/>
        </g>
    </svg>
</div>
`;

export class MenuBottom extends HTMLElement {

    #opened = false;

    connectedCallback() {
        this.#opened = this.hasAttribute("opened")
        this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
            this.$Btn = $('.chevron');
            this.$Div = $('.menu');
        });
    }

    get opened() {
        return this.#opened;
    }

    set opened(value) {
        (value) ? this.open() : this.close()
    }

    open() {
        this.$Btn.addClass('opened');
        this.#opened = true;
    }

    close() {
        this.$Btn.removeClass('opened');
        this.#opened = false;
    }

    show() {
        this.$Div.css('display', '');
    }

    hide() {
        this.$Div.css('display', 'none');
    }
}