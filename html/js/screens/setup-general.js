import { jQuery } from "../system/jquery";
import { Http } from "../system/http";
import { App } from "../models/app";


const html = `
<div class="container">
    <h1>General</h1>
    <form method="post" enctype="application/x-www-form-urlencoded" action="/settings">
        <input id='name' name='name' length=32 placeholder='Friendly Name'><br />
        <br />
        <input id='chip' name='chip' length=32 placeholder='Device Name'><br />
    </form>
</div>
`
const style = `
<style>

.container {
  width: 80vw;
  max-width:300px;
}

h1 {
  position: absolute;
  top: 0;
}

@media screen and (min-height: 730px) {
  h1 { top: 6%; }
}

input {
    padding: 8px;
    font-size: 1em;
    width: 100%;
}

</style>
`;

export class GeneralSettings extends HTMLElement {

  restartRequested = false;

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadowTemplate(style + html, ($) => {
      this.txtName = $('#name');
      this.txtChip = $('#chip');
      this.txtName.value(App.friendlyName());
      this.txtChip.value(App.hostname());
      this.txtName.on('change', this.onNameChange.bind(this));
      this.txtChip.on('change', this.onChipChange.bind(this));
    });
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  async onSave(e) {
    if (this.restartRequested) {
      if (confirm("This will restart your device. Are you sure you want to contine?")) {
        this.restartRequested = false;
        e.restartRequested = true;
      } else {
        e.preventDefault();
      }
    }
  }

  onNameChange(e) {
    App.friendlyName(this.txtName.value());
    this.restartRequested = true;
  }

  onChipChange() {
    App.hostname(this.txtChip.value())
    this.restartRequested = true;
  }
}