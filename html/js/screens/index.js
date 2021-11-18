import { jQuery } from "../system/jquery";
import { Router } from "../system/router";
import { App } from "../models/app";

const template = (self) => `
<div id="conainer">
    <sketch-menu-toggle></sketch-menu-toggle>
    <sketch-outlet>
        <sprinkler-main></sprinkler-main>
    </sketch-outlet>
    <sketch-snackbar></sketch-snackbar>
    <sketch-spinner></sketch-spinner>
</div>`;
export class Index extends HTMLElement {

    connectedCallback() {

        this.jQuery = jQuery(this).attachShadow(async ($) => {
            await App.load();
            $(document).on('back', this.onBack.bind(this));
            $(document).on('escape', this.onEscape.bind(this));
            $(document).on('refresh', this.onRefresh.bind(this));
            $(document).on('spinning', this.onSpinning.bind(this));
            $(document).on('navigate', this.onNavigate.bind(this));
            $(document).on('notification', this.onNotification.bind(this));
            this.render();
        });
    }

    disconnectedCallback() {
        this.jQuery().detach();
    }

    onEscape(e) {
        this.close()
    }

    onRefresh(e) {
        this.render();
    };
    
    onToggle(e) {
        this.$Toggle.item().opened ? this.close() : this.open();
    }

    onSpinning(e) {
        this.$Spinner.item().spinning = e.detail.spinning;
    }

    onNotification(e) {
        this.$Snack.item().show(e.detail);
    }

    onBack(e) {
        const spinner = this.$Spinner.item();
        if (spinner.spinning) {
            spinner.spinning = false;
            e.preventDefault();
            return false;
        }

        if (!this.$Outlet.item().back()) {
            e.preventDefault();
            return false;
        }

        this.$Snack.item().hide();
        return true;
    }

    async onNavigate(e) {
        if (!(await this.$Outlet.item().navigate(e.detail.screen, e.detail.nohistory))) {
            e.preventDefault();
        }
    }

    onNavigateTo(e) {
        this.$Toggle.item().open();
    }

    onNavigateFrom(e) {
        if (e.detail.to == "main") {
            this.$Toggle.item().close();
        }
        else if (e.detail.to == "menu") {
        }
    }

    close() {
        Router.goback();
    }

    open() {
        App.zones().count() > 1 ? Router.navigate('settings') : Router.navigate('menu');
    }

    render() {
        this.jQuery().html(template(this), ($) => {

            this.$Spinner = $('sketch-spinner');
            this.$Toggle = $('sketch-menu-toggle')
                .on('click', this.onToggle.bind(this));
            this.$Outlet = $('sketch-outlet')
                .on('navigate-to', this.onNavigateTo.bind(this))
                .on('navigate-from', this.onNavigateFrom.bind(this));
            this.$Slider = $('sketch-slider');
            this.$Snack = $('sketch-snackbar');

        });
    };
}
