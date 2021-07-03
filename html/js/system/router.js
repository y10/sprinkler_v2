export class Router {

    static forRoot(config) {
        return new Router(config);
    }

    static goback() {
        return document.dispatchEvent(new CustomEvent('back', { cancelable: true }));
    }

    static navigate(screen, keep = true) {
        return document.dispatchEvent(new CustomEvent('navigate', { cancelable: true, detail: { screen, nohistory: !keep } }));
    }

    static refresh() {
        if (document.dispatchEvent(new CustomEvent('refresh', { cancelable: true }))) {
            this.goback();
        };
    }

    config = {
        components: {},
        screens: {},
    };

    constructor(setup) {

        for (const src in setup) {
            const module = setup[src];

            for (const name in module) {
                this.config.screens[module[name].toUpperCase()] = { name, src };
            }

            for (const prop in module) {
                this.config.components[prop] = { name: module[prop].toUpperCase(), src };
            }
        }
    }

    screens(component) {
        const screen = this.config.screens[component];
        if (screen)
            return screen.name;
        return null;
    }

    components(component) {
        return this.config.components[component];
    }
}