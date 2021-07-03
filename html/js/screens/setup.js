import { jQuery, Router, Status, Http } from "../system";
import { App } from "../models/app";

const html = `
<sketch-slider>
  <sprinkler-setup-general></sprinkler-setup-general>
  <sprinkler-setup-wifi></sprinkler-setup-wifi>
  <sprinkler-time></sprinkler-time>
</sketch-slider>
`
export class Setup extends HTMLElement {

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadowTemplate(html, ($) => {
      $(this).on('navigate-from', this.onGoback.bind(this));
    });
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  async onGoback(e) {

    try {
      this.jQuery('sketch-slider > *').forEach(x => {
        if ('onSave' in x) {
          x.onSave(e);
        }
      });

      if (e.defaultPrevented) {
        await App.load();
      }
      else {
        if (await App.save()) {
          Router.refresh();
        }
      }
      if (e.restartRequested) {
        const spinner = Status.wait(10000);
        Http.json('POST', 'esp/restart').catch();
        await spinner;
        App.reload();
      }
    } catch (error) {
      Status.error(error);
    }
  }
}