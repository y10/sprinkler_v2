export class Status {

    static set spinning(value) {
        document.dispatchEvent(new CustomEvent('spinning', { detail: { spinning: value, closed: false } }));
    }

    static wait(timeout = 0) {
        let timer = null;

        class CancalablePromise extends Promise {
            constructor(done, error) {
                super(done, error)
            }

            close() {
                if (timer) clearTimeout(timer);
                document.dispatchEvent(new CustomEvent('spinning', { detail: { spinning: false, closed: true } }));
            }

            cancel() {
                if (timer) clearTimeout(timer);
                Status.spinning = false;
            }
        }

        const promise = new CancalablePromise((done, error) => {

            function onSpinning(e) {
                if (e.detail.spinning == false) {
                    document.removeEventListener('spinning', onSpinning);
                    done(e.detail.closed);
                }
            }

            if (document.dispatchEvent(new CustomEvent('spinning', { detail: { spinning: true } }))) {
                document.addEventListener('spinning', onSpinning, false);
            } else {
                error('Wait canceled.');
            }
        });

        if (timeout)
        {
            timer = setTimeout(() => promise.cancel(), timeout);
        }

        return promise;
    }

    static error(error, timeout = 0) {
        console.error(error);
        const title = "Error";
        const message = error instanceof Error ? error.message : error;
        document.dispatchEvent(new CustomEvent('notification', { detail: { title, message, timeout } }))
    }

    static information(message) {
        const title = (arguments.length === 2 && typeof arguments[1] === 'string') 
            ? arguments[1] 
            : null;
        
        const timeout = (arguments.length === 2 && typeof arguments[1] === 'number') 
            ? arguments[1] 
            : (arguments.length === 3)
                ? arguments[2]
                : 3000;
        console.log((title || "Notification") + ": " + message);
        document.dispatchEvent(new CustomEvent('notification', { detail: { title, message, timeout } }))
    }
}