import { String } from "../system";
import { jQuery } from "../system/jquery";
import { Http } from "../system/http";

const html = `
<div class="container">
  <h1>Time</h1>
  <div class="time-control">
    <select id="hours"></select>
    :
    <select id="minutes"></select>
    :
    <select id="seconds"></select>
  </div>
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

.time-control {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: var(--primary-text-color);  
}

#minutes, #hours, #seconds {
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: var(--primary-background-color);
  color: var(--primary-text-color);
}

select {
  -webkit-appearance: none; 
  -moz-appearance: none;
  appearance: none;
  padding: 0;
  border: 0;
  background-color: transparen;
  background: transparent;
  color: var(--primary-text-color);
}

select option {
  background: var(--primary-background-color);
}

</style>
`;

export class TimeSettings extends HTMLElement {

  timezone = 0;

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadowTemplate(style + html, ($) => {

      this.DdlSeconds = $('#seconds');
      for (let second = 0; second < 60; second++) {
        this.DdlSeconds.append(`<option>${String.format00(second)}</option>`)
      }

      this.DdlMinutes = $('#minutes');
      for (let minute = 0; minute < 60; minute++) {
        this.DdlMinutes.append(`<option>${String.format00(minute)}</option>`)
      }

      this.DdlHours = $('#hours');
      for (let hour = 0; hour < 24; hour++) {
        this.DdlHours.append(`<option>${String.format00(hour)}</option>`)
      }

      this.sync();
    });
  }

  disconnectedCallback() {
    clearInterval(this.timerInterval);
    this.jQuery().detach();
  }

  activate() {
    if (this.usertime) {
      this.timerInterval = setInterval(() => this.onTick(), 1000);
    }
  }

  deactivate() {
    clearInterval(this.timerInterval);
  }

  async sync() {
    try {
      const time = await Http.json('GET', 'esp/time');
      const localtime = this.localtime = new Date(Date.now());
      const usertime = this.usertime = new Date(localtime.getFullYear(), localtime.getMonth(), localtime.getDay(), time.h, time.m, time.s)
      this.timezone = localtime.getHours() - usertime.getHours();

      this.setTime(this.usertime);

      this.timerInterval = setInterval(() => this.onTick(), 1000);
      return true;

    } catch (error) {
      console.error(error);
    }
    return false;
  }

  setTime(time) {
    this.DdlSeconds.item().value = String.format00(time.getSeconds());
    this.DdlMinutes.item().value = String.format00(time.getMinutes());
    this.DdlHours.item().value = String.format00(time.getHours() + this.timezone);
  }

  onTick() {
    const localtime = this.localtime;
    const usertime = this.usertime;
    const curtime = new Date(localtime.getFullYear(), localtime.getMonth(), localtime.getDay(), usertime.getHours(), usertime.getMinutes(), usertime.getSeconds())
    const millis = Date.now() - localtime;
    curtime.setMilliseconds(millis)
    this.setTime(curtime);
  }
}