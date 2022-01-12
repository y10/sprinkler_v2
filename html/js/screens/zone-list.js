import { String, Http, Wsc, jQuery } from "../system";
import { Icons } from "../assets/icons";
import { App } from "../models/app";
import { MAX_ZONES } from "../config";


const template = (self) => `
<style>
.container {
  width: 90%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
  max-width: 1024px;
}

.container > * {
  margin: 0.5rem 0.5rem;
}

h1 {
  position: absolute;
  top: 0;
}

@media screen and (min-height: 730px) {
  h1 { top: 6%; }
}

</style>
<div class="container">
    ${String.join([...Array(MAX_ZONES).keys()].map((o, i) => App.zones(i + 1)), x => 
      x.defined() 
      ?
        `<sketch-checkbox zone-id="${x.id}" placeholder="Zone ${x.id}" text="${x.name}" readonly>
          ${Icons.sprinkler}
        </sketch-checkbox>` 
      : ''
    )}
</div>`;
export class ZoneList extends HTMLElement {

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
      $('sketch-checkbox').on('check', this.onZoneCheck.bind(this));
      Wsc.on('state', this.onUpdate, this);
      if ($(this).inViewport()) {
        this.updateAll().catch();
      }
    });
  }

  disconnectedCallback() {
    Wsc.off('state', this.onUpdate);
    this.jQuery().detach();
  }

  onUpdate(event) {
    this.update(event);
  }

  async onZoneCheck(e) {
    const checkbox = e.srcElement;
    const zoneid = checkbox.getAttribute("zone-id");
    const zone = App.zones(zoneid);
    try {
      const timer = await Http.json('GET', `api/zone/${zone.id}/${(checkbox.checked) ? checkbox.style.color ? "resume" : "start" : "stop"}`);
      this.update(timer);
    } catch (error) {
      console.error(error);
    }
  }

  activate() {
    Wsc.off('state', this.onUpdate);
    Wsc.on('state', this.onUpdate, this);
    App.zones().current = null;
    this.updateAll()
  }

  deactivate() {
    Wsc.off('state', this.onUpdate);
  }

  async updateAll() {
    try {
      const timers = await Http.json('GET', `api/state`);
      if (Object.keys(timers).length > 0) {
        console.log(timers);
        this.jQuery(`sketch-checkbox`).forEach((x, i) => {
          const zone = i + 1;
          const state = (zone in timers) ? timers[zone] : { zone, state: 'stopped' };
          this.update(state);
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  update(timer) {
    const { state } = timer;
    this.jQuery(`.container sketch-checkbox:nth-child(${timer.zone})`).forEach((e, i) => {
      if (state == "paused") {
        e.style.color = "var(--warn-background-color)";
        e.checked = false;
      } else if (state == "stopped") {
        e.style.color = "";
        e.checked = false;
      } else {
        e.style.color = "";
        e.checked = true;
      }
    });
  }
}