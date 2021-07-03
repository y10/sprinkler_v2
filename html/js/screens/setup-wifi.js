import { jQuery } from "../system/jquery";

const html = `
<div class="container">
    <h1>Wifi</h1>
    <form>
        <input id='ssid' name='ssid' length=32 type="text" placeholder='WiFi network name' list="ssid-list"><datalist id="ssid-list"></datalist><br />
        <br />
        <input id='pass' name='pass' length=64 type='password' placeholder='Network security key'><br />
        <br />
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

export class WifiSettings extends HTMLElement {

  connectedCallback() {
    jQuery(this).attachShadowTemplate(style + html);
  }
}