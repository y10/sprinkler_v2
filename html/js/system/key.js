console.log("keyboard events");

document.body.addEventListener('keyup', function (e) {
    if (e.key == "Escape") {
        document.dispatchEvent(new Event('escape'));
    }
});
