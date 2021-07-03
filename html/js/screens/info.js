import { jQuery } from "../system/jquery";

export class Info extends HTMLElement {

  connectedCallback() {
    jQuery(this).attachShadowTemplate('<sprinkler-time></sprinkler-time>');
  }
}