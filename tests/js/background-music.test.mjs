import test from "node:test";
import assert from "node:assert/strict";
import { BackgroundMusic } from "../../public/js/background-music.mjs";

const settle = () => new Promise(setImmediate);

function musicHarness({ state = "running", resume } = {}) {
    const notes = [];
    const gains = [];
    const intervals = new Map();
    let contextRequests = 0;
    let nextTimer = 0;
    function parameter() {
        return {
            events: [],
            setValueAtTime(value, time) {
                this.events.push({ value, time });
            },
            linearRampToValueAtTime(value, time) {
                this.events.push({ value, time });
            },
            exponentialRampToValueAtTime(value, time) {
                this.events.push({ value, time });
            },
            cancelScheduledValues() {},
        };
    }
    const context = {
        currentTime: 0,
        state,
        destination: {},
        resume: resume || (() => Promise.resolve()),
        createGain() {
            const gain = {
                gain: parameter(),
                connect(target) {
                    this.target = target;
                },
                disconnect() {
                    this.disconnected = true;
                },
            };
            gains.push(gain);
            return gain;
        },
        createOscillator() {
            const oscillator = {
                frequency: parameter(),
                stops: [],
                connect(target) {
                    this.target = target;
                },
                disconnect() {
                    this.disconnected = true;
                },
                start(time) {
                    this.startTime = time;
                },
                stop(time) {
                    this.stops.push(time);
                },
            };
            notes.push(oscillator);
            return oscillator;
        },
    };
    const music = new BackgroundMusic(
        () => {
            contextRequests++;
            return context;
        },
        {
            setInterval(callback) {
                const id = ++nextTimer;
                intervals.set(id, callback);
                return id;
            },
            clearInterval(id) {
                intervals.delete(id);
            },
        },
    );
    return {
        music,
        context,
        notes,
        gains,
        intervals,
        get contextRequests() {
            return contextRequests;
        },
        tick(time) {
            context.currentTime = time;
            for (const callback of intervals.values()) callback();
        },
    };
}

test("music stays silent and does not initialize audio until started", () => {
    const app = musicHarness();
    assert.equal(app.contextRequests, 0);
    assert.equal(app.notes.length, 0);
    app.music.stop();
    assert.equal(app.contextRequests, 0);
});

test("starting repeatedly creates a single quiet music loop", async () => {
    const app = musicHarness();
    app.music.start();
    app.music.start();
    await settle();
    app.music.start();
    assert.equal(app.contextRequests, 1);
    assert.equal(app.intervals.size, 1);
    assert.ok(app.notes.length > 0);
    assert.ok(app.gains[0].gain.events[0].value < 0.3);
    assert.ok(
        app.notes.every((note) => note.startTime > 0 && note.startTime < 0.35),
    );
});

test("stopping silences queued notes and clears the scheduler without suspending effects", async () => {
    const app = musicHarness();
    app.music.start();
    await settle();
    app.context.currentTime = 0.1;
    app.music.stop();
    app.music.stop();
    assert.equal(app.intervals.size, 0);
    assert.ok(app.notes.every((note) => note.stops.at(-1) === 0.13));
    assert.equal(app.gains[0].gain.events.at(-1).value, 0);
    assert.equal(app.context.state, "running");
    const count = app.notes.length;
    app.tick(20);
    assert.equal(app.notes.length, count);
});

test("turning music off while browser audio resumes prevents late playback", async () => {
    let finishResume;
    const app = musicHarness({
        state: "suspended",
        resume: () =>
            new Promise((resolve) => {
                finishResume = resolve;
            }),
    });
    app.music.start();
    app.music.stop();
    app.context.state = "running";
    finishResume();
    await settle();
    assert.equal(app.notes.length, 0);
    assert.equal(app.intervals.size, 0);
    assert.equal(app.gains[0].disconnected, true);
});

test("rapid off and on while resuming cannot create overlapping loops", async () => {
    let finishResume;
    const app = musicHarness({
        state: "suspended",
        resume: () =>
            new Promise((resolve) => {
                finishResume = resolve;
            }),
    });
    app.music.start();
    app.music.stop();
    app.context.state = "running";
    app.music.start();
    finishResume();
    await settle();
    assert.equal(app.intervals.size, 1);
    assert.ok(app.notes.every((note) => note.target.target === app.gains[1]));
});

test("blocked audio fails quietly and can be retried after a user gesture", async () => {
    const app = musicHarness({
        state: "suspended",
        resume: () => Promise.reject(new Error("Playback blocked")),
    });
    app.music.start();
    await settle();
    assert.equal(app.intervals.size, 0);
    assert.equal(app.notes.length, 0);
    app.context.state = "running";
    app.music.start();
    await settle();
    assert.equal(app.intervals.size, 1);
    assert.ok(app.notes.length > 0);
});

test("browsers without audio support can still start and stop safely", () => {
    const music = new BackgroundMusic(() => {
        throw new Error("Audio unavailable");
    });
    assert.doesNotThrow(() => {
        music.start();
        music.stop();
        music.start();
    });
});

test("the melody loops for long matches and skips missed audio instead of bursting", async () => {
    const app = musicHarness();
    app.music.start();
    await settle();
    for (let time = 0.1; time < 35; time += 0.1) app.tick(time);
    assert.equal(app.intervals.size, 1);
    assert.ok(app.notes.some((note) => note.startTime > 33));
    const count = app.notes.length;
    app.tick(600);
    const fresh = app.notes.slice(count);
    assert.ok(fresh.length > 0 && fresh.length < 15);
    assert.ok(
        fresh.every((note) => note.startTime >= 600 && note.startTime < 600.35),
    );
    assert.ok(
        app.notes.every((note) =>
            Number.isFinite(note.frequency.events[0].value),
        ),
    );
});

test("ended notes and stopped loops release their audio connections", async () => {
    const app = musicHarness();
    app.music.start();
    await settle();
    app.music.stop();
    for (const note of app.notes) note.onended();
    assert.ok(
        app.notes.every(
            (note) => note.disconnected && note.target.disconnected,
        ),
    );
    assert.equal(app.gains[0].disconnected, true);
});
