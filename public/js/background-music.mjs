const STEP_SECONDS = 60 / 116 / 2;
const MELODY = [
    [76, 79, 81, 79, 76, 74, 72, null],
    [74, 76, 79, null, 79, 76, 74, null],
    [76, 81, 84, 81, 79, 76, 74, null],
    [77, 76, 74, 72, 74, 77, 79, null],
    [79, 84, 83, 81, 79, 76, 79, null],
    [81, 79, 77, 76, 77, 81, 79, null],
    [79, 76, 74, 71, 74, 79, 77, 74],
    [76, 79, 72, null, 72, null, null, null],
];
const CHORDS = [
    [48, 52, 55],
    [43, 47, 50],
    [45, 48, 52],
    [41, 45, 48],
    [48, 52, 55],
    [41, 45, 48],
    [43, 47, 50],
    [48, 52, 55],
];

export class BackgroundMusic {
    constructor(getAudioContext, timers = globalThis) {
        this.getAudioContext = getAudioContext;
        this.timers = timers;
        this.session = null;
    }

    start() {
        if (this.session) return;
        let session;
        try {
            const context = this.getAudioContext();
            const output = context.createGain();
            output.gain.setValueAtTime(0.24, context.currentTime);
            output.connect(context.destination);
            session = {
                context,
                output,
                voices: new Set(),
                timer: null,
                step: 0,
                nextTime: context.currentTime + 0.03,
            };
            this.session = session;
            const ready =
                context.state === "running"
                    ? Promise.resolve()
                    : context.resume();
            ready
                .then(() => {
                    if (this.session !== session) return;
                    session.nextTime = context.currentTime + 0.03;
                    this.schedule(session);
                    session.timer = this.timers.setInterval(
                        () => this.schedule(session),
                        100,
                    );
                })
                .catch(() => {
                    if (this.session === session) this.stop();
                });
        } catch {
            if (session && this.session === session) this.stop();
        }
    }

    stop() {
        const session = this.session;
        if (!session) return;
        this.session = null;
        if (session.timer !== null) this.timers.clearInterval(session.timer);
        const now = session.context.currentTime;
        session.output.gain.cancelScheduledValues(now);
        session.output.gain.setValueAtTime(0.24, now);
        session.output.gain.linearRampToValueAtTime(0, now + 0.025);
        for (const oscillator of session.voices) {
            try {
                oscillator.stop(now + 0.03);
            } catch {
                /* A note may already have ended. */
            }
        }
        if (!session.voices.size) session.output.disconnect();
    }

    schedule(session) {
        if (this.session !== session || session.context.state !== "running")
            return;
        const now = session.context.currentTime;
        if (session.nextTime < now) session.nextTime = now + 0.03;
        while (session.nextTime < now + 0.35) {
            const bar = Math.floor(session.step / 8);
            const beat = session.step % 8;
            const note = MELODY[bar][beat];
            const chord = CHORDS[bar];
            const start = session.nextTime;
            if (note !== null) {
                this.tone(session, note, start, 0.3, 0.12, "sine");
                this.tone(session, note + 12, start, 0.14, 0.025, "sine");
            }
            if (beat === 0) {
                for (const pitch of chord)
                    this.tone(
                        session,
                        pitch + 12,
                        start,
                        1.4,
                        0.026,
                        "triangle",
                    );
            }
            if (beat % 2 === 0) {
                this.tone(
                    session,
                    chord[0] + (beat === 2 || beat === 6 ? 7 : 0),
                    start,
                    0.32,
                    0.13,
                    "sine",
                );
            }
            if (beat === 2 || beat === 6)
                this.tone(session, 84, start, 0.045, 0.035, "triangle");
            session.step = (session.step + 1) % 64;
            session.nextTime += STEP_SECONDS;
        }
    }

    tone(session, midi, start, duration, volume, type) {
        const oscillator = session.context.createOscillator();
        const envelope = session.context.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            440 * 2 ** ((midi - 69) / 12),
            start,
        );
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.linearRampToValueAtTime(volume, start + 0.008);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        oscillator.connect(envelope);
        envelope.connect(session.output);
        session.voices.add(oscillator);
        oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
            session.voices.delete(oscillator);
            if (this.session !== session && !session.voices.size)
                session.output.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + duration + 0.01);
    }
}
