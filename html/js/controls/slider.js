const html = `
<div id="pages" class="slide-window">
    <div class="slides">
        <slot></slot>
    </div>
    <div class="slides-nav"></div>
</div>
`;

const style = `
<style>
.slide-window {
    position: fixed;
    width: 100%;
    height: 100%;
    overflow: hidden;
    top: 0px;
    left: 0px;
}

.slides {
    height: 100%;
    position: absolute;
    margin: 0px;
    padding: 0px;
    -webkit-transform: translate3d(0px, 0px, 0px);
    transform: translate3d(0px, 0px, 0px);
    transition: all 0.66s ease;
    -webkit-transition: all 0.66s ease;
}

.slides-nav {
    font: 2em "Georgia", "Apple Symbols", serif;
    line-height: 0;
    position: absolute;
    bottom: 28px;
    width: 100%;
    text-align: center;
    display: table;
    transition: all 0.66s ease;
    -webkit-transition: all 0.66s ease;
}
  
@media screen and (min-height: 666px) {
    .slides-nav { bottom: 10%; }
}
  
.slides-nav>span {
    cursor: pointer;
    color: white;
    opacity: 0.1;
}

.slides-nav>span.selected {
    opacity: 1;
}

::slotted(*) {
    position: relative;
    float: left;
    margin: 0;
    padding: 0;
    height: 100%;
    display: grid;
    place-items: center;
    transform: translate3d(0px, 0px, 0px);
    -webkit-transform: translate3d(0px, 0px, 0px);
    transform-style: preserve-3d;
    -webkit-transform-style: preserve-3d;
}
</style>
`;

function activate(slider) {
    const selectedIndex = slider.selectedIndex;
    const slideElement = slider.slotChildren[selectedIndex];
    const slidesNavElement = slider.slidesNavElement;

    if (typeof slideElement.activate !== "undefined") {
        slideElement.activate();
    }

    if (slidesNavElement) {
        const slideNavElement = slidesNavElement.children[selectedIndex];
        slideNavElement.classList.add("selected")
    }
}

function deactivate(slider) {
    const selectedIndex = slider.selectedIndex;
    const slideElement = slider.slotChildren[selectedIndex];
    const slidesNavElement = slider.slidesNavElement;

    if (slideElement && typeof slideElement.deactivate !== "undefined") {

        slideElement.deactivate();
    }

    if (slidesNavElement) {
        const slideNavElement = slidesNavElement.children[selectedIndex];
        if (slideNavElement) slideNavElement.classList.remove("selected")
    }
}

function addNavItem(slider) {
    const slidesNavElement = slider.slidesNavElement;
    const dot = document.createElement('span');
    const index = slidesNavElement.children.length;
    dot.innerHTML = "&#9679;";
    dot.onclick = () => { slider.goTo(index); };
    slidesNavElement.appendChild(dot);
}

function windowWidth() {
    const clientWidth = document.clientWidth, body = document.body;
    return document.compatMode === "CSS1Compat" && clientWidth || body && body.clientWidth || clientWidth;
}

export class Slider extends HTMLElement {

    connectedCallback() {

        const clientWidth = windowWidth();
        const navigation = (this.getAttribute("navigation") || "true") == "true";

        const template = document.createElement('template')
        template.innerHTML = style + html;

        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(template.content.cloneNode(true));

        const sliderWindow = shadowRoot.querySelector("#pages");

        this.slidesElement = sliderWindow.querySelector(".slides");

        const slotElement = sliderWindow.querySelector("slot");

        const slotChildren = this.slotChildren = slotElement.assignedElements();

        this.slidesNavElement = sliderWindow.querySelector(".slides-nav");

        const selectedIndex = this.selectedIndex = parseInt(this.getAttribute("start")) || 0;

        this.slidesNavElement.style.visibility = (slotChildren.length > 1) ? 'visible' : 'hidden';

        this.slidesElement.style.width = (slotChildren.length * clientWidth) + 'px';
        for (var i = 0; i < slotChildren.length; i++) {
            var slide = slotChildren[i];
            slide.classList.add('slide');
            slide.style.width = clientWidth + 'px';
        }

        if (navigation) {
            for (var i = 0; i < slotChildren.length; i++) {
                addNavItem(this);
            }
        }

        if (this.slotChildren.length > 0) {
            this.goTo(selectedIndex);
        }

        this.slidesElement.addEventListener("dblclick", this.onDblClick.bind(this));

        shadowRoot.addEventListener("unload", () => {
            document.removeEventListener('slide-x', this.onSlide);
        });

        document.addEventListener('slide-x', this.onSlide.bind(this), false);

        window.addEventListener('resize', this.onResize.bind(this));
    }

    disconnectedCallback() {
        document.removeEventListener('slide-x', this.onSlide);
    }

    goTo(selectedIndex) {
        const slotChildren = this.slotChildren;

        if (selectedIndex == -1) { selectedIndex = slotChildren.length - 1; }
        else if (selectedIndex == slotChildren.length) { selectedIndex = 0; }

        const $margin = windowWidth() * selectedIndex;

        if (typeof (this.selectedIndex) !== 'undefined') {
            deactivate(this);
        }

        this.selectedIndex = selectedIndex;

        activate(this);

        this.slidesElement.style.transform = 'translate3d(-' + $margin + 'px,0px,0px)';
    }

    canSlide(e) {
        if (this.slidesElement.offsetParent === null)
            return false;
        /*
                if (e.slideElement && e.slideElement.classList.contains("slide"))
                    return true;
        */
        return true;
    }

    onSlide(e) {
        if (this.canSlide(e)) {
            if (e.left) {
                this.goTo(this.selectedIndex + 1);
            } else if (e.right) {
                this.goTo(this.selectedIndex - 1);
            }
        }
    };

    onDblClick(e) {
        const width = windowWidth();
        const middle = width / 2;
        const quorter = middle / 2
        if (e.clientX > (width - quorter)) {
            //left
            this.goTo(this.selectedIndex + 1);
        } else if (e.clientX < (middle - quorter)) {
            //right
            this.goTo(this.selectedIndex - 1);
        }
    };

    onResize(e) {
        const clientWidth = windowWidth();
        const slotChildren = this.slotChildren;
        this.slidesElement.style.width = (slotChildren.length * clientWidth) + 'px';
        for (var i = 0; i < slotChildren.length; i++) {
            var slide = slotChildren[i];
            slide.style.width = clientWidth + 'px';
        }

        this.goTo(this.selectedIndex);
    }
}
