import { String } from "../system";
import { jQuery } from "../system/jquery";
import { Router } from "../system/router";
import { App } from "../models/app";

const template = (self) => `
<div id="conainer">
    <sketch-slider start="${self.currentIndex}">
        ${App.zones().count() > 1 ? '<sprinkler-list></sprinkler-list>' : ''}
        ${String.join(App.zones(), (x) => `<sprinkler-zone zone-id="${x.id}"></sprinkler-zone>`)}
    </sketch-slider>
</div>`;
export class Main extends HTMLElement {

    visibleMenu = false;

    get currentIndex() {
        return App.zones().count() > 1 
             ? App.zones().currentIndex + 1
             : 0;
    }

    connectedCallback() {
        this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
            $(document).on('back', this.onBack.bind(this));
            $(document).on('slide-y', this.onSlide.bind(this));
        });
    }

    disconnectedCallback() {
        this.jQuery().detach();
    }

    onSlide(e) {
        if (e.up && this.jQuery(this).isAttached()) {
            if (Router.navigate('menu', false)) {
                this.visibleMenu = true;
            }
        }
        else if (e.down && this.visibleMenu) {
           Router.refresh();
        }
    };

    onBack(e) {
        this.jQuery().html(template(this));
    }
}
