import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const ORIGIN = "https://rumble.example";
const URLS = ["/", "/css/game.css", "/js/game.mjs", "/manifest.webmanifest"];
const CACHE_NAME = "math-rope-rumble-%2F-build1";
const source = readFileSync(
    new URL("../../resources/js/service-worker.js", import.meta.url),
    "utf8",
)
    .replace("__CACHE_VERSION__", "build1")
    .replace("__PRECACHE_URLS__", JSON.stringify(URLS));

function workerHarness({ offline = false, failPath = null } = {}) {
    const handlers = {};
    const storage = new Map();
    const requests = [];
    let claims = 0;
    let skips = 0;
    const absolute = (value) =>
        new URL(typeof value === "string" ? value : value.url, ORIGIN).href;
    const network = async (request) => {
        requests.push(request);
        const url = new URL(absolute(request));
        if (offline || url.pathname === failPath)
            throw new Error("Network unavailable");
        return new Response(`network:${url.pathname}`, { status: 200 });
    };
    class ScopedRequest extends Request {
        constructor(input, options) {
            super(absolute(input), options);
        }
    }
    function makeCache() {
        const entries = new Map();
        return {
            entries,
            async addAll(values) {
                const responses = await Promise.all(values.map(network));
                values.forEach((value, index) =>
                    entries.set(absolute(value), responses[index]),
                );
            },
            async match(value, options = {}) {
                const wanted = new URL(absolute(value));
                for (const [key, response] of entries) {
                    const actual = new URL(key);
                    if (
                        options.ignoreSearch
                            ? actual.origin === wanted.origin &&
                              actual.pathname === wanted.pathname
                            : key === wanted.href
                    )
                        return response.clone();
                }
                return undefined;
            },
        };
    }
    const caches = {
        async open(name) {
            if (!storage.has(name)) storage.set(name, makeCache());
            return storage.get(name);
        },
        async keys() {
            return [...storage.keys()];
        },
        async delete(name) {
            return storage.delete(name);
        },
    };
    const self = {
        location: { origin: ORIGIN },
        clients: {
            async claim() {
                claims++;
            },
        },
        async skipWaiting() {
            skips++;
        },
        addEventListener(type, handler) {
            handlers[type] = handler;
        },
    };
    vm.runInNewContext(source, {
        self,
        caches,
        URL,
        Request: ScopedRequest,
        fetch: network,
    });
    async function lifecycle(type, properties = {}) {
        let work = Promise.resolve();
        handlers[type]({
            ...properties,
            waitUntil(promise) {
                work = promise;
            },
        });
        await work;
    }
    function fetchRequest(path, { method = "GET", mode = "navigate" } = {}) {
        let response;
        handlers.fetch({
            request: { url: new URL(path, ORIGIN).href, method, mode },
            respondWith(promise) {
                response = promise;
            },
        });
        return response;
    }
    return {
        storage,
        requests,
        caches,
        lifecycle,
        fetchRequest,
        setOffline(value) {
            offline = value;
        },
        get claims() {
            return claims;
        },
        get skips() {
            return skips;
        },
    };
}

test("installation precaches the full shell without forcing an update", async () => {
    const worker = workerHarness();
    await worker.lifecycle("install");
    assert.equal(worker.storage.get(CACHE_NAME).entries.size, URLS.length);
    assert.ok(
        worker.requests.every(
            (request) =>
                request.cache === "reload" &&
                request.credentials === "same-origin",
        ),
    );
    assert.equal(worker.skips, 0);
});

test("an incomplete download removes the failed cache", async () => {
    const worker = workerHarness({ failPath: "/js/game.mjs" });
    await assert.rejects(worker.lifecycle("install"), /Network unavailable/);
    assert.equal(worker.storage.has(CACHE_NAME), false);
});

test("activation removes only older caches for the same app scope", async () => {
    const worker = workerHarness();
    await worker.lifecycle("install");
    await worker.caches.open("math-rope-rumble-%2F-old");
    await worker.caches.open("math-rope-rumble-%2Fother%2F-old");
    await worker.caches.open("another-app");
    await worker.lifecycle("activate");
    assert.equal(worker.storage.has("math-rope-rumble-%2F-old"), false);
    assert.equal(worker.storage.has("math-rope-rumble-%2Fother%2F-old"), true);
    assert.equal(worker.storage.has("another-app"), true);
    assert.equal(worker.storage.has(CACHE_NAME), true);
    assert.equal(worker.claims, 1);
});

test("installed launch URLs and versioned assets work offline", async () => {
    const worker = workerHarness();
    await worker.lifecycle("install");
    const initialRequests = worker.requests.length;
    worker.setOffline(true);
    assert.equal(
        await (await worker.fetchRequest("/?source=installed")).text(),
        "network:/",
    );
    assert.equal(
        await (
            await worker.fetchRequest("/js/game.mjs?v=123", { mode: "cors" })
        ).text(),
        "network:/js/game.mjs",
    );
    assert.equal(worker.requests.length, initialRequests);
});

test("the shell stays on a consistent cached build until updated", async () => {
    const worker = workerHarness();
    await worker.lifecycle("install");
    worker.requests.length = 0;
    assert.equal(await (await worker.fetchRequest("/")).text(), "network:/");
    assert.equal(
        await (
            await worker.fetchRequest("/css/game.css?v=new-build", {
                mode: "cors",
            })
        ).text(),
        "network:/css/game.css",
    );
    assert.equal(worker.requests.length, 0);
});

test("unrelated routes, writes, and cross-origin requests are untouched", () => {
    const worker = workerHarness();
    assert.equal(worker.fetchRequest("/up"), undefined);
    assert.equal(worker.fetchRequest("/", { method: "POST" }), undefined);
    assert.equal(
        worker.fetchRequest("https://other.example/js/game.mjs", {
            mode: "cors",
        }),
        undefined,
    );
});

test("an update activates only after an explicit message", async () => {
    const worker = workerHarness();
    await worker.lifecycle("message", {
        data: { type: "UNRELATED" },
        ports: [],
    });
    assert.equal(worker.skips, 0);
    await worker.lifecycle("message", {
        data: { type: "SKIP_WAITING" },
        ports: [],
    });
    assert.equal(worker.skips, 1);
});

test("offline readiness checks all cached files", async () => {
    const worker = workerHarness();
    await worker.lifecycle("install");
    let ready;
    const ports = [
        {
            postMessage(data) {
                ready = data.ready;
            },
        },
    ];
    await worker.lifecycle("message", {
        data: { type: "GET_OFFLINE_STATUS" },
        ports,
    });
    assert.equal(ready, true);
    worker.storage.get(CACHE_NAME).entries.delete(`${ORIGIN}/js/game.mjs`);
    await worker.lifecycle("message", {
        data: { type: "GET_OFFLINE_STATUS" },
        ports,
    });
    assert.equal(ready, false);
});
