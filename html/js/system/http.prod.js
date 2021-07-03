async function fetchUrl(url, options) {
    const { timeout = 2000 } = options;
    const controller = new AbortController();
    const timerid = setTimeout(() => controller.abort(), timeout);
    let response = null;
    try {
        response = await fetch(url, { ...options, signal: controller.signal});
        clearTimeout(timerid);
    } catch (error) {
        clearTimeout(timerid);
        if (controller.signal.aborted)
            throw new Error("Request exceeded " + timeout/1000 + "s timeout.");        
        throw error;
    }
    if (!response.ok)
        throw new Error((await response.text()) || `[${response.status}] Server response is not OK.`);

    return response;
}

export class Http {
    static get(url, params, timeout) {
        var path = url;
        if (params) {
            let i = 0
            for (let prm in params) {
                path += (i == 0) ? "?" : "&";
                path += prm + "=" + params[prm];
                i++;
            }
        }

        return fetchUrl(path, {timeout})
    }

    static async getJson(url, params, timeout) {
        return (await this.get(url, params, timeout)).json();
    }

    static async postJson(url, params, timeout) {
        const response = await fetchUrl(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
            timeout: timeout
        });

        return await response.json();
    }

    static async postForm(url, data, timeout) {
        const response = await fetchUrl(url, {
            method: 'POST',
            timeout: timeout,
            body: data
        });

        return await response.text();
    }

    static post(service, params, timeout) {
        if (params instanceof FormData) {
            return this.postForm(service, params, timeout)
        }
        else {
            return this.postJson(service, params, timeout)
        }
    }

    static json(method, url, params, timeout) {
        return (method.toUpperCase() == 'GET') 
            ? this.getJson(url, params, timeout) 
            : this.postJson(url, params, timeout);
    }

    static import(file) {
        return new Promise((done, error) => {
            const script = document.createElement('script');
            document.head.appendChild(script);
            script.onload = done;
            script.onerror = error;
            script.async = true;
            script.src = file;
        });
    }
}