import { String } from "../system";
import { jQuery } from "../system/jquery";

const template = (self) => `
<style>
  .container{
    top: 0;
    left: 0;
    position: absolute;
    width: 100vw;
    height: 100vh;
    background-color: var(--primary-background-color);
    visibility: hidden;
  }
  
  .spin
  {
    visibility: visible;
  }

  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 100;
    perspective: 200px;
  }

  @keyframes spin {
    0% {
      transform: scale(1);
    }
    15% {
      transform: translate(-${self.particleSize / 2}px, -${self.particleSize / 2}px) scale(3);
    }
    50% {
      transform: scale(1);
    }
  }

  i {
    display: block;
    position: absolute;
    opacity: 1;
  } 

  i b {
    display: block;
    width: ${self.particleSize}px;
    height: ${self.particleSize}px;
    border-radius: ${self.particleSize}px;
    background: rgba(255,255,255,1);
    box-shadow: 0px 0px 14px rgba(255,255,255,1);
    
    animation-name: spin;
    animation-duration: ${self.lapDuration}s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  ${String.join([...Array(self.particles).keys()].map((i) => self.item(i)), (x, i) => `
  i:nth-child(${i + 1}) {
    transform: rotate( ${x.angle}deg ) translate3d( ${self.radius}px, 0, 0 );
  }

  i:nth-child(${i + 1}) b {
    animation-delay: ${x.delay}s;
  }`)}
</style>
<div class="container">
    <div class="spinner">
        ${String.join([...Array(self.particles).keys()], (i) => `<i><b></b></i>`)}
    </div>
<div>
`;
export class Spinner extends HTMLElement {

  particles = 100;
  particleSize = 6;
  radius = 100;
  lapDuration = 3;

  connectedCallback() {
    jQuery(this).attachShadowTemplate(template, ($) => {
      this.container = $(".container");
    });
  }

  item(x) {
    const i = x + 1
    return {
      angle: (((i) / this.particles) * 360),
      delay: (i * (this.lapDuration / (this.particles - 2))).toFixed(5)
    }
  }

  get spinning() {
    return ('container' in this) ? this.container.hasClass('spin') : false;
  }

  set spinning(value) {
    if ('container' in this) {
      value ? this.container.addClass('spin') : this.container.removeClass('spin')
    }
  }
}