import { String, Http, Wsc } from "../system";
import { jQuery } from "../system/jquery";
import { App } from "../models/app";

import { TIME_LIMIT_DEFAULT } from "../config";

const style = `
<style>

h1 {
  position: absolute; top: 0; 
}

@media screen and (min-height: 666px) {
  h1 { top: 10%; }
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
  stroke: var(--primary-border-color);
}

.timer__path-remaining {
  stroke-width: 7px;
  stroke-linecap: round;
  transform: rotate(90deg);
  transform-origin: center;
  transition: 1s linear all;
  fill-rule: nonzero;
  stroke: currentColor;
}

.timer__path-remaining.green {
  color: var(--info-background-color);
}

.timer__path-remaining.orange {
  color: var(--warn-background-color);
}

.timer__path-remaining.red {
  color: var(--alert-background-color);
}

.timer__time, .timer__stop {
  position: absolute;
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: var(--primary-text-color);  
}

.timer__stop {
  width: 48px;
  height: 48px;
  margin-top: 120px;
  margin-left: 5px;
  visibility: hidden;
  color:var(--primary-text-color, white);
  border: 0;
}

.timer__time-minutes, .timer__time-seconds {
  color: var(--primary-text-color);
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: var(--primary-background-color);
}

.disabled select, .disabled .timer__time, .disabled .timer__path-remaining {
  opacity: 0.7;
}

.started.disabled select, .started.disabled .timer__time {
  color: var(--primary-disabled-color);
}

.started.disabled .timer__path-remaining {
  color: var(--info-background-color);
}

.started select, .started .timer__time, .started .timer__path-remaining {
  color: var(--info-background-color);
}

.stopped select, .stopped .timer__time, .stopped .timer__path-remaining {
  color: var(--warn-background-color);
}

.started.disabled .timer__stop {
  visibility: hidden
}

.started .timer__stop {
  visibility: visible
}

.timer.touch  {
  animation: touch 0.5s forwards;  
}

.timer.clicked  {
  animation: boom 0.5s;  
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

@keyframes touch {
  from {width: 300px; height: 300px}
  to {width: 280px; height: 280px;}
}

@keyframes boom {
  0% {    width: 300px;    height: 300px  }
  20% {    width: 280px;    height: 280px  }
  50% {    width: 100vw;    height: 100vh  }
  100% {    width: 300px;    height: 300px  }
}

@media screen and (min-height: 666px) {
  @keyframes boom {
    0% {    width: 300px;    height: 300px  }
    20% {    width: 280px;    height: 280px  }
    50% {    width: 375px;    height: 375px  }
    100% {    width: 300px;    height: 300px  }
  }
}

</style>
`;
const template = (self) => `${style}
<h1>${App.zones().count() > 1 ? self.zone.name : ''}</h1>
<div id="timer" class="timer disabled">
  <svg class="timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g class="timer__circle">
          <circle class="timer__path-elapsed" cx="50" cy="50" r="45"></circle>
          <path id="timer-path-remaining" stroke-dasharray="283" class="timer__path-remaining"
              d="
                M 50, 50
                m -45, 0
                a 45,45 0 1,0 90,0
                a 45,45 0 1,0 -90,0
              "></path>
      </g>
  </svg>
  <span id="timer-stop" class="timer__stop">
    <svg height="36" width="36" xmlns="http://www.w3.org/2000/svg" viewBox="-6 0 32 32">
      <g>
        <rect height="32" width="5" x="0" y="12" fill="currentColor"></rect>
        <rect height="32" width="5" x="12" y="12" fill="currentColor"></rect>
      </g>
    </svg>  
  </span>
  <span id="timer-time" class="timer__time">
      <select id="timer-time-minutes" class="timer__time-minutes">
      ${String.join(['00', '05', '15', '20', '30'], (x) => `<option>${x}</option>`)}
      </select>
      :
      <select id="timer-time-seconds" class="timer__time-seconds" disabled>
      ${String.join(Array(60).keys(), (x) => `<option>${String.format00(x)}</option>`)}
      </select>
  </span>
</div>
`
const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 60;
const ALERT_THRESHOLD = 10;
const COLOR_CODES = {
  info: {
    color: "green"
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};

export class Zone extends HTMLElement {

  timeLeft = TIME_LIMIT_DEFAULT;
  timeLimit = TIME_LIMIT_DEFAULT;
  timePassed = 0;
  timerInterval = null;

  connectedCallback() {
    this.zone = App.zones(this.getAttribute("zone-id"));
    this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {

      this.PnlTimer = $('#timer');
      this.DdlMinutes = $('#timer-time-minutes');
      this.DdlSeconds = $('#timer-time-seconds');
      this.BtnStart = $('#timer-start');
      this.BtnStop = $('#timer-stop');
      this.SvgRemainingPath = $("#timer-path-remaining");

      this.DdlMinutes.on('change', this.onMinutesChange.bind(this))

      this.PnlTimer.on('touchstart', () => {
        this.PnlTimer.addClass("touch")
      }).on('touchend', () => {
        this.PnlTimer.removeClass("touch")
      }).on('mousedown', () => {
        this.PnlTimer.addClass("touch")
      }).on('mouseup', () => {
        this.PnlTimer.removeClass("touch")
      })

      this.PnlTimer.onClick((e) => {
        (e.clicks > 1 || e.ticks > 500) ? this.onDoubleClick(e) : this.onSingleClick(e);
      });

      if ($(this).inViewport()) {
        this.update().catch();
      }
    });

    Wsc.on('state', this.onUpdate, this)
      .on('disconnect', this.onDisconnect, this)
      .on('connected', this.onConnected, this);
  }

  disconnectedCallback() {
    Wsc.off('state', this.onUpdate)
      .off('disconnect', this.onDisconnect)
      .off('connected', this.onConnected);
    this.jQuery().detach();
  }

  onConnected() {
    this.PnlTimer.removeClass("disabled");
  }

  onDisconnect() {
    this.PnlTimer.addClass("disabled");
  }

  onUpdate(state) {
    if (state && (state["zone"] == this.zone.id)) {
      this.update(state);
    }
  }

  onSingleClick(e) {
    if (this.timePassed > 0) {
      this.timerInterval ? this.pauseTimer() : this.resumeTimer();
    }
  }

  onDoubleClick(e) {
    this.PnlTimer.addClass("clicked");
    setTimeout(() => this.PnlTimer.removeClass('clicked'), 1000);
    this.timerInterval
      ? this.clearTimer()
      : this.timePassed
        ? this.clearTimer()
        : this.startTimer(TIME_LIMIT_DEFAULT);
  }

  async onMinutesChange(e) {
    const minutes = parseInt(e.srcElement.value);

    if (this.timerInterval)
      await this.clearTimer();

    if (minutes)
      this.startTimer(minutes * 60);
  }

  clearTimerInterval() {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  onTimesUp() {
    this.clearTimer();
  }

  async clearTimer() {
    if (this.PnlTimer.hasClass("disabled"))
      return;

    this.PnlTimer.removeClass("started").removeClass("stopped").addClass("disabled");
    var success = await this.execute("stop");
    this.PnlTimer.removeClass("disabled")

    if (!(success))
      return;

    this.clearTimerInterval();

    this.timeLeft = 0;
    this.timePassed = 0;

    this.formatTime(0);
    this.setCircleDasharray();
    this.setRemainingPathColor('none');
  }

  async pauseTimer() {
    if (this.PnlTimer.hasClass("disabled"))
      return;

    this.PnlTimer.addClass("disabled").addClass("stopped").removeClass("started");
    var success = await this.execute("pause");
    this.PnlTimer.removeClass("disabled");

    if (!(success))
      return;

    this.clearTimerInterval();
    this.setRemainingPathColor(COLOR_CODES.warning.color);
  }

  async resumeTimer() {
    if (this.PnlTimer.hasClass("disabled"))
      return;

    this.PnlTimer.addClass("started").addClass("disabled").removeClass("stopped");
    var success = await this.execute("resume");
    this.PnlTimer.removeClass("disabled");

    if (!(success))
      return;

    this.clockTimer(this.timeLeft);
  }

  async startTimer(totalSeconds) {
    if (this.PnlTimer.hasClass("disabled"))
      return;

    this.PnlTimer.addClass("started").addClass("disabled").removeClass("stopped");
    var success = await this.execute("start", { d: parseInt(totalSeconds / 60) });
    this.PnlTimer.removeClass("disabled");

    if (!(success))
      return;

    this.timeLimit = totalSeconds;
    this.clockTimer(totalSeconds);
  }

  clockTimer(totalSeconds) {

    this.timeLeft = totalSeconds;
    this.timePassed = this.timePassed += 1;
    this.timeLeft = this.timeLimit - this.timePassed;

    this.formatTime(this.timeLeft);
    this.setRemainingPathColor(COLOR_CODES.info.color);

    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => {
        this.timePassed += 1;
        this.timeLeft = this.timeLimit - this.timePassed;

        if (this.timeLeft > 0) {
          this.formatTime(this.timeLeft);
          this.setCircleDasharray();
          this.setRemainingPathColorFromThreshold();
        }
        else {
          this.onTimesUp();
        }
      }, 1000);
    }
  }

  formatTime(totalSeconds) {
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    let options = [0, 5, 15, 20, 30];
    let index = 0;
    for (index = options.length - 1; index >= 0; index--) {
      const option = options[index];
      if (minutes == option)
        break;
      if (minutes > option) {
        index += 1
        break;
      }
    }

    if (index == options.length || options[index] != minutes) {
      options = [...options.slice(0, index), minutes, ...options.slice(index)].map(x => String.format00(x))
      this.DdlMinutes.html('');
      options.forEach((o, i) => {
        this.DdlMinutes.append(`<option>${o}</option>`)
      });
    }

    this.DdlMinutes.item().selectedIndex = index;
    this.DdlSeconds.item().value = String.format00(seconds);
  }

  setRemainingPathColorFromThreshold() {
    const { alert, warning, info } = COLOR_CODES;
    if (this.timeLeft == 0) {
      this.setRemainingPathColor('none')
    } else if (this.timeLeft <= alert.threshold) {
      this.setRemainingPathColor(alert.color)
    } else if (this.timeLeft <= warning.threshold) {
      this.setRemainingPathColor(warning.color)
    } else {
      this.setRemainingPathColor(info.color)
    }
  }

  calculateTimeFraction() {
    const rawTimeFraction = this.timeLeft / this.timeLimit;
    return rawTimeFraction - (1 / this.timeLeft) * (1 - rawTimeFraction);
  }

  setRemainingPathColor(color) {
    const { alert, warning, info } = COLOR_CODES;
    this.SvgRemainingPath
      .removeClass(warning.color)
      .removeClass(alert.color)
      .removeClass(info.color);

    if (color != 'none') {
      this.SvgRemainingPath.addClass(color)
    }
  }

  setCircleDasharray() {
    const circleDasharray = `${(
      this.calculateTimeFraction() * FULL_DASH_ARRAY
    ).toFixed(0)} ${FULL_DASH_ARRAY}`;

    this.SvgRemainingPath
      .attr("stroke-dasharray", circleDasharray);
  }

  deactivate() {
    this.clearTimerInterval();

    Wsc.off('state', this.onUpdate)
      .off('disconnect', this.onDisconnect)
      .off('connected', this.onConnected);
  }

  async activate() {
    App.zones().current = this.zone;

    Wsc.off('state', this.onUpdate)
      .off('disconnect', this.onDisconnect)
      .off('connected', this.onConnected);

    Wsc.on('state', this.onUpdate, this)
      .on('disconnect', this.onDisconnect, this)
      .on('connected', this.onConnected, this);

    this.update();
  }

  async update(state) {
    if (!state) {
      state = await this.state();
      console.log(state);
    }
    const timer = state;
    if (timer.state != "disabled") {
      const duration = parseInt(timer.duration * 60);
      const passed = parseInt(timer.millis / 1000);
      const remains = duration - passed;
      switch (timer.state) {
        case "stopped":
          this.clearTimerInterval();
          this.timeLeft = 0;
          this.timePassed = 0;
          this.formatTime(0);
          this.setCircleDasharray();
          this.setRemainingPathColor('none');
          this.PnlTimer.removeClass("started").removeClass("stopped");
          break;
        case "started":
          this.timeLimit = duration;
          this.timePassed = passed;
          this.clockTimer(remains);
          this.setRemainingPathColor(COLOR_CODES.info.color);
          this.PnlTimer.addClass("started").removeClass("stopped");
          break;
        case "paused":
          this.timeLeft = remains;
          this.timeLimit = duration;
          this.timePassed = passed;
          this.formatTime(remains);
          this.clearTimerInterval();
          this.setCircleDasharray();
          this.setRemainingPathColor(COLOR_CODES.warning.color);
          this.PnlTimer.addClass("stopped").removeClass("started");
          break;
      }
      this.PnlTimer.removeClass("disabled");
    }
    else {
      this.clearTimerInterval();
      this.PnlTimer.addClass("disabled");
    }
  }

  async execute(action, params) {
    try {
      await Http.json('GET', 'api/zone/' + this.zone.id + '/' + action, params);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async state() {
    try {
      return await Http.json('GET', 'api/zone/' + this.zone.id + '/state');
    } catch (error) {
      console.error(error);
      return { state: "disabled" };
    }
  }
}