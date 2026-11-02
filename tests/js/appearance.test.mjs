import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(
    new URL("../../public/js/appearance.js", import.meta.url),
    "utf8",
);

function appearanceHarness({
    saved = null,
    darkSystem = false,
    deniedStorage = false,
} = {}) {
    const callbacks = {};
    const elements = new Map();
    const storage = new Map(
        saved === null ? [] : [["math-rope-rumble.theme.v1", saved]],
    );
    const root = { dataset: {}, style: {} };
    const meta = {
        setAttribute(name, value) {
            this[name] = value;
        },
    };
    const system = {
        matches: darkSystem,
        addEventListener(name, handler) {
            callbacks.system = handler;
        },
    };
    const document = {
        documentElement: root,
        readyState: "loading",
        querySelector() {
            return meta;
        },
        getElementById(id) {
            return elements.get(id);
        },
        addEventListener(name, handler) {
            callbacks[name] = handler;
        },
    };
    const localStorage = {
        getItem(key) {
            if (deniedStorage) throw new Error("Storage unavailable");
            return storage.get(key) ?? null;
        },
        setItem(key, value) {
            if (deniedStorage) throw new Error("Storage unavailable");
            storage.set(key, value);
        },
    };
    vm.runInNewContext(source, {
        document,
        localStorage,
        window: {
            matchMedia() {
                return system;
            },
        },
    });
    const bootTheme = root.dataset.theme;
    for (const id of ["theme-button", "theme-icon", "theme-label"]) {
        elements.set(id, {
            setAttribute(name, value) {
                this[name] = value;
            },
            addEventListener(name, handler) {
                this[name] = handler;
            },
        });
    }
    callbacks.DOMContentLoaded();
    return {
        root,
        meta,
        elements,
        storage,
        bootTheme,
        toggle() {
            elements.get("theme-button").click();
        },
        changeSystem(dark) {
            system.matches = dark;
            callbacks.system();
        },
    };
}

test("the initial theme follows the device before controls are rendered", () => {
    const app = appearanceHarness({ darkSystem: true });
    assert.equal(app.bootTheme, "dark");
    assert.equal(app.root.style.colorScheme, "dark");
    assert.equal(app.meta.content, "#181329");
    assert.equal(app.elements.get("theme-button")["aria-pressed"], "true");
});

test("a saved preference overrides the system theme", () => {
    const app = appearanceHarness({ saved: "light", darkSystem: true });
    assert.equal(app.bootTheme, "light");
    app.changeSystem(false);
    app.changeSystem(true);
    assert.equal(app.root.dataset.theme, "light");
});

test("the control switches and saves both themes with accurate labels", () => {
    const app = appearanceHarness();
    app.toggle();
    assert.equal(app.root.dataset.theme, "dark");
    assert.equal(app.storage.get("math-rope-rumble.theme.v1"), "dark");
    assert.equal(
        app.elements.get("theme-button")["aria-label"],
        "Switch to light mode",
    );
    assert.equal(app.elements.get("theme-icon").href, "#icon-sun");
    app.toggle();
    assert.equal(app.root.dataset.theme, "light");
    assert.equal(app.elements.get("theme-icon").href, "#icon-moon");
});

test("system changes are followed until a theme is chosen", () => {
    const app = appearanceHarness();
    app.changeSystem(true);
    assert.equal(app.root.dataset.theme, "dark");
    app.toggle();
    app.changeSystem(false);
    app.changeSystem(true);
    assert.equal(app.root.dataset.theme, "light");
});

test("theme controls still work when browser storage is denied", () => {
    const app = appearanceHarness({ deniedStorage: true });
    app.toggle();
    assert.equal(app.root.dataset.theme, "dark");
    app.toggle();
    assert.equal(app.root.dataset.theme, "light");
});
