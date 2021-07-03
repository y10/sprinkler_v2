import { jQuery } from "../system/jquery";
import { String } from "../system"
import { App } from "../models/app";

const style = `
<style>
.week {
  position: absolute;
  width: 280px;
  top: 25px; 
}

@media screen and (min-height: 666px) {
  .week { top: 10%; }
}

.timer {
  position: relative;
  width: 300px;
  height: 300px;
  display: grid;
  place-items: center;
}

.timer__svg {
  transform: scaleX(-1);
}

.timer__circle {
  fill: none;
  stroke: none;
}

.timer__path-elapsed {
  stroke-width: 7px;
  stroke: grey;
}

.timer__ctrl {
  position: absolute;
  display: grid;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.timer__time, .timer__remove {
  color: var(--info-background-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.timer__name {
  height: 64px;
  width: 300px;
  font-size: 48px;
  color: var(--primary-text-color);
  background: transparent;
  text-align: center;
  opacity: 0.7;
  outline: 0;
  border: 0;
}

.timer__name:focus {
  opacity: 1;
}

.timer__remove {
  width: 100%;
  height: 48px;
  color: var(--primary-text-color);
}

.timer__time-minutes, .timer__time-hours, .timer__time-duration {
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: var(--primary-background-color);
  color: var(--info-background-color);
}

select {
    -webkit-appearance: none; 
    -moz-appearance: none;
    appearance: none;
    padding: 0;
    border: 0;
    background-color: transparen;
    background: transparent;
    color: var(--info-background-color);
}

select option {
  background: var(--primary-background-color);
}

</style>
`;

const template = (self) => `${style}
<div class="timer">
  <svg class="timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g class="timer__circle">
          <circle class="timer__path-elapsed" cx="50" cy="50" r="45"></circle>
  </svg>
  <div class="timer__ctrl">
    ${App.zones().count() > 1 ? `<input id="timer-name" class="timer__name" type="text" autocapitalize="words" value="${self.zone.name}">` : '&nbsp;'}
    <span id="timer-time" class="timer__time">
      <select id="timer-time-hours" class="timer__time-hours"></select>
      :
      <select id="timer-time-minutes" class="timer__time-minutes"></select>
      &nbsp;
      <select id="timer-time-duration" class="timer__time-duration"></select>
    </span>
    <div class="timer__remove">${App.zones().count() > 1 ? '<span id="timer-remove"> - </span>' : '&nbsp;'}</div>
  </div>
</div>
<sketch-week id="week" class="week" value="${self.day.name}"></sketch-week>`
export class ZoneSettings extends HTMLElement {

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadow();
    this.zone = App.zones(this.getAttribute("zone-id"));
    this.day = this.zone.days("all");
    this.timer = this.day.timers(0);
    this.render();
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  onDurationChange(e) {
    this.timer.d = parseInt(e.srcElement.value);
    this.render();
  }

  onMinuteChange(e) {
    this.timer.m = parseInt(e.srcElement.value);
    this.render();
  }

  onHourChange(e) {
    this.timer.h = parseInt(e.srcElement.value);
    this.render();
  }

  onDayChange(e) {
    this.day = this.zone.days(e.detail.day);
    this.timer = this.day.timers(0);
    this.render();
  }

  onNameChange(e) {
    const value = e.srcElement.value;
    this.zone.name = value;
  }

  onRemove(e) {
    if (confirm("Are you sure you want to continue?")) {
      setTimeout(() => {
        this.dispatchEvent(new CustomEvent('remove', { bubbles: true, detail: { id: this.zone.id } }));
      }, 300);
    }
  }

  render() {
    this.jQuery().html(template(this), ($) => {

      this.DdlDuration = $('#timer-time-duration');
      this.DdlMinutes = $('#timer-time-minutes');
      this.DdlHours = $('#timer-time-hours');
      this.BtnRemove = $('#timer-remove');
      this.TxtZone = $('#timer-name');
      this.CtlWeek = $('#week');

      [0, 5, 15, 20, 30].forEach(minutes => {
        this.DdlDuration.append(`<option ${(this.timer.d == minutes) ? "selected='selected'" : ""}>${String.format00(minutes)}</option>`)
      });

      for (let minute = 0; minute < 60; minute++) {
        this.DdlMinutes.append(`<option ${(this.timer.m == minute) ? "selected='selected'" : ""}>${String.format00(minute)}</option>`)
      }

      for (let hour = 0; hour < 24; hour++) {
        this.DdlHours.append(`<option ${(this.timer.h == hour) ? "selected='selected'" : ""}>${String.format00(hour)}</option>`)
      }

      this.DdlDuration.on('change', this.onDurationChange.bind(this));

      this.DdlMinutes.on('change', this.onMinuteChange.bind(this));

      this.DdlHours.on('change', this.onHourChange.bind(this));

      this.TxtZone.on('change', this.onNameChange.bind(this));

      this.BtnRemove
        .on('click', this.onRemove.bind(this))

      this.CtlWeek.on('change',
        this.onDayChange.bind(this))
    });
  };

  activate() {
    App.zones().current = this.zone;
  }
}