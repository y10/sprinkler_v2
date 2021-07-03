import { App } from "../models/app";
import { jQuery } from "../system/jquery";
import { Http } from "../system/http";
import { Status } from "../system/status";
import { Version, FIRMWARE_URL } from "../config";

const html = `
<div class="container">
  <header>
    <h1>Firmware</h1>
    <h3>v${Version}</h3>
  </header>
  <div>
    <input type="text" id='file-addr' name='firmware-addr' length=50 placeholder='${FIRMWARE_URL}'><br />
    <br />
    or
    <br />
    <br />
    <div>
      <label for="file-upload" class="file-upload-button">
          Select file
      </label>
      <input type="file" accept=".bin,.bin.gz" name="firmware" id="file-upload"
          data-title="No file selected">
    </div>
    <br/>
    <br/>
    <button id="submit">Update</button>
  </div>
</div>
`
const style = `
<style>

.container {
  width: 80vw;
  max-width:300px;
}

header {
  position: absolute;
  top: 0;
}

@media screen and (min-height: 730px) {
  h1 { top: 6%; }
}

input[type="text"] {
  padding: 8px;
  font-size: 1em;
  width: 100%;
}

button {
  border: 0;
  border-radius: 0.3rem;
  background-color: var(--primary-text-color);
  line-height: 2.4rem;
  font-size: 1.2rem;
  width: 100%;
  color: var(--secondary-text-color);
}

.file-upload-button {
  border: 0;
  border-radius: 0.3rem;
  display: inline-block;
  line-height: 2.4rem;
  font-size: 1.2rem;
  text-align: center;
  cursor: pointer;
  background: var(--secondary-background-color);
  color: var(--secondary-text-color);
  width: 100%;
}

#file-upload {
  position: relative;
  width: 100%;
  min-height: 6em;
  outline: none;
  visibility: hidden;
  cursor: pointer;
  color: var(--alert-text-color);
  box-shadow: 0 0 5px solid currentColor;
}

#file-upload:before {
  content: attr(data-title);
  position: absolute;
  top: 0.5em;
  left: 0;
  width: 100%;
  min-height: 6em;
  line-height: 2em;
  padding-top: 1.5em;
  opacity: 1;
  visibility: visible;
  text-align: center;
  border: 0.25em dashed currentColor;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

#file-upload:hover:before {
  border-style: solid;
  box-shadow: inset 0px 0px 0px 0.25em currentColor;
}
</style>
`;

export class Firmware extends HTMLElement {

  connectedCallback() {
    this.jQuery = jQuery(this).attachShadowTemplate(style + html, ($) => {
      this.fileUri = $("#file-addr");
      this.fileUpload = $("#file-upload")
        .on('change', this.onSelectFile.bind(this))
        .on('drop', this.onDropFile.bind(this))
      this.submitButton = $("#submit")
        .on('click', this.onSubmit.bind(this))
    });
  }

  disconnectedCallback() {
    this.jQuery().detach();
  }

  onDropFile(e) {
    const input = this.fileUpload.item();
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      let imgName = files[0].name;
      input.setAttribute("data-title", imgName);
      input.files = files;
    }

    e.preventDefault();
    e.stopPropagation();
  }

  onSelectFile(e) {
    const input = this.fileUpload.item();
    const files = input.files;
    if (files && files[0]) {
      let imgName = files[0].name;
      input.setAttribute("data-title", imgName);
    }

    e.preventDefault();
    e.stopPropagation();
  }

  async onSubmit(e) {

    const spinner = Status.wait();

    const fileUri = this.fileUri.item();
    const input = this.fileUpload.item();
    const files = input.files;

    try {
      if (files && files[0]) {
        await this.uploadUpdate(files[0])
      } else {
        await this.donwloadUpdate(fileUri.value || FIRMWARE_URL);
      }
      await App.wait(10000);
      await Http.get('/', null, 10000);
      spinner.close();
    } catch (error) {
      spinner.cancel();
      Status.error(error);
    }

    if (await spinner) App.reload();
  }

  async uploadUpdate(file) {
    console.log("Uploading file: " + file.name);
    var data = new FormData();
    data.append("firmware", file);
    await Http.postForm("esp/update", data, 60000);
    Status.information("Restarting...", 0);
  }

  async donwloadUpdate(url) {
    console.log("Downloading from: " + url);
    const data = new FormData();
    data.append("firmware-addr", url);
    const error = await Http.postForm("esp/upgrade", data, 60000);
    if (error) throw new Error(error);
    Status.information("Restarting...", 0);
  }
}