console.log("touch events");

let xDown = null;
let yDown = null;
let xDiff = null;
let yDiff = null;

function getTouches(evt) {
    return evt.touches ||             // browser API
        evt.originalEvent.touches; // jQuery
}

function onTouchStart(e) {
    const firstTouch = getTouches(e)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
};

function onTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    xDiff = xDown - xUp;
    yDiff = yDown - yUp;
};

function onTouchEnd(evt) {
    if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
        if (Math.abs(xDiff) > 10) {
            const e = new Event('slide-x')
            if (xDiff > 0) {
                e.left = true;
            } else {
                e.right = true;
            }
            document.dispatchEvent(e);
        }
    } else {
        if (Math.abs(yDiff) > 50) {
            const e = new Event('slide-y')
            if (yDiff > 0) {
                e.up = true;
            } else {
                e.down = true;
            }
            document.dispatchEvent(e);
        }
    }
    /* reset values */
    xDown = null;
    yDown = null;
    xDiff = null;
    yDiff = null;
}

document.addEventListener('touchstart', onTouchStart, false);
document.addEventListener('touchmove', onTouchMove, false);
document.addEventListener('touchend', onTouchEnd, false);