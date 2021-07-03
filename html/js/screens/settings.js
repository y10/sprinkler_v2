import { String, Router, Status } from "../system";
import { jQuery } from "../system/jquery";
import { App } from "../models/app";

const template = (self) => `
<div id="conainer">
  <sketch-slider start="${self.currentIndex}">
    ${App.zones().count() > 1 ? '<sprinkler-menu></sprinkler-menu>' : ''} 
    ${String.join(App.zones(), (x) => `<sprinkler-settings-zone zone-id="${x.id}"></sprinkler-settings-zone>`)}
  </sketch-slider>
</div>`;
export class Settings extends HTMLElement {

  get currentIndex() {
    return App.zones().count() > 1
      ? App.zones().currentIndex + 1
      : 0;
  }

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadow(($) => {
      $(this).on('navigate-from', this.onSave.bind(this));
    });

    this.render();
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  onRemove(e) {
    App.zones(e.detail.id).remove();
    this.render();
  }

  async onSave(e) {
    try {
      if (await App.save()) {
        Router.refresh();
      }
    } catch (error) {
      Status.error(error);
    }
  }

  render() {
    this.jQuery().html(template(this), ($) => {
      $('sketch-slider').on('remove', this.onRemove.bind(this));
    });
  };
}

