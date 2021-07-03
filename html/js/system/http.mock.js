function timeout(options, defaultValue) {
    if (!defaultValue) defaultValue = 2000;
    return options ? options["timeout"] || defaultValue : defaultValue;
}

function send(method, service, options) {
 
    return new Promise((done, error) => {
        console.log(method + ": " + service);
        setTimeout(() => {
            const result = Math.random();
            if (result < 0.3) {
                error("Request has been canceled.");
            }
            else if (result > 0.7) {
                done({});
            }
            else {
                done({});
            }
        }, timeout(options))
    });
}

export class Http {
    static get(service, params, options) {
        return send("GET", service, options);
    }

    static postJson(service, params, options) {
        return send("POST", service, options);
    }

    static postForm(service, data, options) {
        return send("POST", service, options);
    }

    static post(service, params, options) {
        if (params instanceof FormData) {
            return this.postForm(service, params, options)
        }
        else {
            return this.postJson(service, params, options)
        }
    }

    static async json(method, service, params, options) {
        return send(method, service, options);
    }

    static import(file) {

        var scriptTag = document.createElement("script");
        scriptTag.src = file;
        scriptTag.async = true;

        document.body.appendChild(scriptTag);

        return new Promise((done, error) => {
            scriptTag.onload = function () {
                done();
            }
        });
    }
}
