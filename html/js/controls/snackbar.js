import { String } from "../system/";
import { jQuery } from "../system/jquery";

const template = `
<style>
#snackbar {
    visibility: hidden;
    width: 238px; 
    margin-left: -127px; 
    background-color: var(--secondary-background-color); 
    color: var(--secondary-text-color)
    font-size: smaller;
    border-radius: 2px; 
    padding: 16px 8px; 
    position: fixed; 
    z-index: 30; 
    left: 50%; 
    bottom: 30px; 
}

#close {
    position: absolute;
    right: 2px;
    top: 2px;
}

.show {
    visibility: visible !important; 
    -webkit-animation: fadein 0.5s;
    animation: fadein 0.5s;
}

.hide {
    visibility: hidden !important; 
    -webkit-animation: fadeout 0.5s 2.5s;
    animation: fadeout 0.5s 2.5s;
}

@-webkit-keyframes fadein {
    from {bottom: 0; opacity: 0;}
    to {bottom: 30px; opacity: 1;}
}

@keyframes fadein {
    from {bottom: 0; opacity: 0;}
    to {bottom: 30px; opacity: 1;}
}

@-webkit-keyframes fadeout {
    from {bottom: 30px; opacity: 1;}
    to {bottom: 0; opacity: 0;}
}

@keyframes fadeout {
    from {bottom: 30px; opacity: 1;}
    to {bottom: 0; opacity: 0;}
}
</style>
<div id="snackbar">
    <svg id="close" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="none" stroke="#626262" stroke-width="2" d="M7 7l10 10M7 17L17 7"/></svg>
    <span id="message"></span>
</div>`;
export class Snackbar extends HTMLElement {

    connectedCallback() {
        this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
            this.$snakbar = $('#snackbar');
            this.$message = $('#message');
            this.$close = $('#close')
                .on('click', this.onClose.bind(this));
        });
    }

    disconnectedCallback() {
        this.jQuery().detach();
    }

    onClose(e) {
        this.hide();
    }

    hide() {
        this.$snakbar.removeClass('show').addClass('hide');
    }

    show(notification) {
        const { title, message, timeout } = notification;
        this.$message.html((message || title))
        this.$snakbar.removeClass('hide').addClass('show');
        if (timeout) {
            this.$close.css('display', 'none');
            setTimeout(() => this.hide(), timeout);
        }
        else {
            this.$close.css('display', '');
        }
    }
}