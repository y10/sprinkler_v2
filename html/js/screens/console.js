import { jQuery, String, Status, Http } from "../system";
import { Log } from "../system/log";
import { App } from "../models/app";

const itemTemplate = (e) => `
<div contenteditable="true">
  <span class="log-level" style="color: var(--${e.level}-background-color);">${e.level}</span>
  <span class="log-scope">${e.scope ? `[${e.scope}]` : '[sys]'}</span>&nbsp;
  ${e.log}
</div>`;

const template = (self) => `
<style>

.log-level, .log-scope { 
  display: inline-block;
  text-align: right;
}
.log-scope { 
  color: rgba(255,255,255,0.7);
  width: 50px;
}
.log-level { 
  vertical-align: top;
  font-size: x-small;
}

.clear-svg {
  color: var(--primary-text-color);
}

#container {
  width: 90%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 50px;
  margin-left: auto;
  margin-right: auto;
  max-width: 1024px;
}

#log {
  height: 80vh;
  overflow-y: auto;
  min-width: 300px;
}

#log-control {
  width: 80vw;
}

h1 {
  position: absolute; top: 0; 
}

button {
  border: 0;
  border-radius: 0.3rem;
  background-color: var(--secondary-background-color);
  line-height: 2.4rem;
  font-size: 1.2rem;
  width: 100%;
  color: var(--secondary-text-color);
  margin: 8px 0;
}

#disable-log{
  background-color: var(--alert-background-color);
  color: var(--alert-text-color);
}

</style>
<div id="container">
  <h1>Console</h1>
  <section id="log-view" style="display:${Log.empty() ? 'none' : ''}">
    <div id="log-toolbar">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="none-svg" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="none" stroke="white" stroke-width="2" d="M12 1v8M6.994 4.52a9.044 9.044 0 0 0-1.358 1.116a9 9 0 1 0 11.37-1.117"></path></svg>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="info-svg" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 48 48"><circle fill="#2196F3" cx="24" cy="24" r="21"></circle><path fill="#fff" d="M22 22h4v11h-4z"></path><circle fill="#fff" cx="24" cy="16.5" r="2.5"></circle></svg>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="warn-svg" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1024 1024"><path d="M955.7 856l-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zM480 416c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v184c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V416zm32 352a48.01 48.01 0 0 1 0-96a48.01 48.01 0 0 1 0 96z" fill="#ffce31"></path></svg>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="error-svg" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 12 12"><g fill="none"><path d="M6 11A5 5 0 1 0 6 1a5 5 0 0 0 0 10zm-.75-2.75a.75.75 0 1 1 1.5 0a.75.75 0 0 1-1.5 0zm.258-4.84a.5.5 0 0 1 .984 0l.008.09V6l-.008.09a.5.5 0 0 1-.984 0L5.5 6V3.5l.008-.09z" fill="red"></path></g></svg>
    <span style="float: right;">
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="clear-svg" aria-hidden="true" focusable="false" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16"><g fill="currentColor"><path d="M10 12.6l.7.7l1.6-1.6l1.6 1.6l.8-.7L13 11l1.7-1.6l-.8-.8l-1.6 1.7l-1.6-1.7l-.7.8l1.6 1.6l-1.6 1.6zM1 4h14V3H1v1zm0 3h14V6H1v1zm8 2.5V9H1v1h8v-.5zM9 13v-1H1v1h8z"></path></g></svg>
    </span>
  </div>
    <div id="log">
      ${String.join(Log, (e) => itemTemplate(e))}
    </div>
  </section>
  <section id="log-control" style="display:${Log.empty() ? '' : 'none'}">
    <button id="enable-log" style="display:${App.logLevel() == "none" ? '' : 'none'}">enable</button>
    <button id="disable-log" style="display:${App.logLevel() != "none" ? '' : 'none'}">disable</button>
  </section>
</div>
`
export class Console extends HTMLElement {

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadowTemplate(template, ($) => {
      $(document).on('sketch-event', this.onEvent.bind(this));
      $(document).on('refresh', this.onRefresh.bind(this));
      $('.clear-svg').on('click', this.onClear.bind(this));
      $('.none-svg').on('click', this.onStop.bind(this));
      $('.info-svg').on('click', this.onInfo.bind(this));
      $('.warn-svg').on('click', this.onWarn.bind(this));
      $('.error-svg').on('click', this.onError.bind(this));
      $('#enable-log').on('click', this.onInfo.bind(this));
      $('#disable-log').on('click', this.onStop.bind(this));
      this.logView = $('#log-view');
      this.logControl = $('#log-control');
      this.log = $('#log');
      this.onFetch();
    });
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  onRefresh(e) {
    if (this.jQuery(this).isAttached()) {
      e.preventDefault();
      this.onFetch(e);
    }
  };

  onFetch(e) {
    this.log.html('');
    Log.fetch().catch();
  }

  onClear(e) {
    if (e.detail) {
      Log.clear();
      this.log.html('');
      this.logView.css("display", "none");
      this.logControl.css("display", "");
    }
  }

  onStop(e) {
    App.logLevel('none')
  }

  onInfo(e) {
    App.logLevel('info')
  }

  onWarn(e) {
    App.logLevel('warn')
  }

  onError(e) {
    App.logLevel('error')
  }

  onEvent(e) {
    if (e.detail) {
      this.log.insert(itemTemplate(e.detail))
      this.logView.css("display", "");
      this.logControl.css("display", "none");
    }
  }
}