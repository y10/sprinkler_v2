import { jQuery } from "../system/jquery";

const template = (self) => `
<style>
.checkbox-input {
    clip: rect(0 0 0 0);
    -webkit-clip-path: inset(100%);
            clip-path: inset(100%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px;
  }
  .checkbox-input:checked + .checkbox-tile {
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    color: var(--info-background-color);
  }
  .checkbox-input:checked + .checkbox-tile .checkbox-icon, 
  .checkbox-input:checked + .checkbox-tile .checkbox-text {
    color: var(--info-background-color);
  }

  .checkbox-input:disabled + .checkbox-tile .checkbox-icon, 
  .checkbox-input:disabled + .checkbox-tile .checkbox-text {
    color: #494949;
  }

  .checkbox-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 7rem;
    min-height: 7rem;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    transition: 0.15s ease;
    cursor: pointer;
    position: relative;
  }
  
  .checkbox-icon {
    transition: 0.375s ease;
  }
  .checkbox-icon svg {
    width: 3rem;
    height: 3rem;
  }

  .checkbox-text {
    color: currentColor;
    transition: 0.375s ease;
    text-align: center;
    background: transparent;
    width: 7rem;
    border:0;
    outline:0;
  }

</style>
<div class="checkbox">
    <label class="checkbox-wrapper">
        <input type="checkbox" class="checkbox-input" ${self.checked ? 'checked' : ''} ${self.disabled ? 'disabled' : ''} />
        <span class="checkbox-tile">
            <span class="checkbox-icon">
                <slot></slot>
            </span>
            <input type="text" placeholder="${self.placeholder}" value="${self.text}" ${self.readonly ? 'readonly' : ''} class="checkbox-text" />
        </span>
    </label>
</div>
`
export class Checkbox extends HTMLElement {

  #text = "";
  #checked = false;
  #disabled = false;
  #readonly = false;

  connectedCallback() {
    this.#text = this.getAttribute("text");
    this.#checked = this.hasAttribute("checked");
    this.#disabled = this.hasAttribute("disabled");
    this.#readonly = this.hasAttribute("readonly");
    this.placeholder = this.getAttribute("placeholder");
    this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
      this.checkbox = $('.checkbox-input').on('change', this.onCheck.bind(this));
      this.textbox = $('.checkbox-text').on('change', this.onChange.bind(this)).on('click', this.onClick.bind(this));
    });
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  get disabled() {
    return this.#disabled;
  }

  get readonly() {
    return this.#readonly;
  }

  get checked() {
    return this.#checked;
  }

  set checked(value) {
    return this.checkbox.item().checked = this.#checked = value;
  }

  get text() {
    return this.#text;
  }

  set text(value) {
    return this.textbox.item().value = this.#text = value;
  }

  onClick(e) {
    this.checked = true;
  }

  onCheck(e) {
    this.checked = e.srcElement.checked;
    this.dispatchEvent(new Event('check'))
  }

  onChange(e) {
    this.text = e.srcElement.value;
    this.dispatchEvent(new Event('change'))
  }
}