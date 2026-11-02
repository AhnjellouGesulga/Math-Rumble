import {
    RumbleGame,
    normalizeSettings,
    PULLS_TO_WIN,
    DIFFICULTIES,
    getDifficultyPreview,
} from "./game-core.mjs";
import { BackgroundMusic } from "./background-music.mjs";

const $ = (id) => document.getElementById(id);
const teams = ["red", "blue"];
const labels = { red: "Red", blue: "Blue" };
const answerKeys = {
    a: ["red", 0],
    s: ["red", 1],
    d: ["red", 2],
    j: ["blue", 0],
    k: ["blue", 1],
    l: ["blue", 2],
};
const form = $("settings-form");
const overlay = $("arena-overlay");
const helpDialog = $("help-dialog");
const resetDialog = $("reset-dialog");
const resultsDialog = $("results-dialog");
const defaults = JSON.parse($("game-config").textContent);
const storageKey = "math-rope-rumble.settings.v1";
const soundKey = "math-rope-rumble.sound.v1";
const musicKey = "math-rope-rumble.music.v1";
const readStorage = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};
const saveStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* Gameplay also works without storage. */
    }
};
let saved;
try {
    saved = JSON.parse(readStorage(storageKey));
} catch {
    saved = null;
}
const game = new RumbleGame(normalizeSettings(saved || defaults));
let soundOn = readStorage(soundKey) === "true";
let musicOn = readStorage(musicKey) !== "false";
let audio;
const music = new BackgroundMusic(getAudioContext);
let countdownEnd = 0;
let countdownRemaining = 3000;
let pausedDuringCountdown = false;
let lastCountdownNumber = null;
let lastRenderedPhase = "";
let lastSecond = -1;
let resetWasActive = false;
let pendingResetAction = null;
let confettiTimeout;
let previewTimeout;
const feedbackStates = { red: null, blue: null };
let layoutFrame;

function addTapRipple(button, event) {
    if (
        button.disabled ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
        return;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "tap-ripple";
    ripple.setAttribute("aria-hidden", "true");
    ripple.style.left = `${event ? event.clientX - rect.left : rect.width / 2}px`;
    ripple.style.top = `${event ? event.clientY - rect.top : rect.height / 2}px`;
    ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
    });
    button.append(ripple);
}

function showPullPop(team) {
    const pop = $(`${team}-pull-pop`);
    pop.textContent =
        game.streaks[team] >= 3
            ? `+1 pull! ${game.streaks[team]} in a row!`
            : "+1 pull!";
    pop.classList.remove("is-popping");
    void pop.offsetWidth;
    pop.classList.add("is-popping");
}

function syncFullscreen() {
    const button = $("fullscreen-button");
    button.hidden = !document.fullscreenEnabled;
    const active = Boolean(document.fullscreenElement);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
        "aria-label",
        active ? "Exit fullscreen" : "Enter fullscreen",
    );
    button.title = active ? "Exit fullscreen" : "Enter fullscreen";
    $("fullscreen-label").textContent = active
        ? "Exit fullscreen"
        : "Fullscreen";
    schedulePlayFit();
}

function fitPlayArea() {
    if (game.phase === "ready") return;
    const arena = $("arena");
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const fixedHeight =
        document.querySelector(".game-card").getBoundingClientRect().bottom +
        window.scrollY -
        arena.getBoundingClientRect().height;
    const minimumHeight = viewportHeight < 450 ? 44 : 90;
    const bottomPadding =
        parseFloat(
            getComputedStyle(document.querySelector(".page-shell"))
                .paddingBottom,
        ) || 0;
    const arenaHeight = Math.max(
        minimumHeight,
        Math.min(
            260,
            Math.floor(
                viewportHeight - fixedHeight - Math.max(12, bottomPadding),
            ),
        ),
    );
    const sceneWidth = Math.min(
        arena.clientWidth,
        Math.max(100, ((arenaHeight - 14) * 900) / 290),
    );
    arena.style.setProperty("--arena-height", `${arenaHeight}px`);
    arena.style.setProperty("--scene-width", `${sceneWidth}px`);
}

function schedulePlayFit() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(fitPlayArea);
}

function getAudioContext() {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    return audio;
}

function sound(frequency = 500, duration = 0.1, type = "sine") {
    if (!soundOn) return;
    try {
        getAudioContext();
        if (audio.state === "suspended") audio.resume().catch(() => {});
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.06, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + duration,
        );
        oscillator.connect(gain);
        gain.connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + duration);
    } catch {
        /* A browser without Web Audio can still play. */
    }
}

function announce(message) {
    $("announcer").textContent = message;
}

function syncSoundButton() {
    const label = soundOn ? "Turn sound effects off" : "Turn sound effects on";
    $("sound-button").setAttribute("aria-label", label);
    $("sound-button").setAttribute("aria-pressed", String(soundOn));
    $("sound-button").title = label;
    $("sound-icon").setAttribute(
        "href",
        soundOn ? "#icon-sound" : "#icon-mute",
    );
}

function syncMusic() {
    const label = musicOn
        ? "Turn background music off"
        : "Turn background music on";
    $("music-button").setAttribute("aria-label", label);
    $("music-button").setAttribute("aria-pressed", String(musicOn));
    $("music-button").title = `${label}. Plays during the match.`;
    $("music-label").textContent = musicOn ? "Music on" : "Music off";
    $("music-icon").setAttribute(
        "href",
        musicOn ? "#icon-music" : "#icon-music-off",
    );
    if (
        musicOn &&
        !document.hidden &&
        ["playing", "countdown"].includes(game.phase)
    )
        music.start();
    else music.stop();
}

function writeSettings(settings) {
    for (const name of ["operation", "difficulty"]) {
        $(name).value = settings[name];
    }
    $("minutes").value = settings.minutes;
    $("rounds").value = settings.rounds;
    updateDifficultyHint();
    updateNumberSuggestions(true);
}

function readSettings() {
    return normalizeSettings({
        operation: $("operation").value,
        difficulty: $("difficulty").value,
        minutes: $("minutes").value,
        rounds: $("rounds").value,
    });
}

function updateDifficultyHint() {
    const value = $("difficulty").value;
    const operation = $("operation").value;
    for (const difficulty of DIFFICULTIES) {
        const preview = getDifficultyPreview(operation, difficulty);
        const option = $(`difficulty-example-${difficulty}`);
        option.textContent = `${option.dataset.label} · ${preview.example.split(" = ")[0]}`;
    }
    const preview = getDifficultyPreview(operation, value);
    $("difficulty-hint").textContent =
        `${preview.description} Try ${preview.example}.`;
}

function updateNumberSuggestions(restoreSelection = false) {
    for (const suggestion of form.querySelectorAll(
        "[data-number-suggestion]",
    )) {
        const input = $(suggestion.dataset.numberSuggestion);
        const preset = [...suggestion.options].find(
            (option) =>
                option.value !== "custom" &&
                input.validity.valid &&
                Number(option.value) === input.valueAsNumber,
        );
        if (!preset) suggestion.value = "custom";
        else if (restoreSelection || suggestion.value !== "custom")
            suggestion.value = preset.value;
        $(`${input.id}-custom`).hidden = suggestion.value !== "custom";
    }
    $("minutes-unit").textContent =
        $("minutes").valueAsNumber === 1 ? "minute" : "minutes";
    $("rounds-unit").textContent =
        $("rounds").valueAsNumber === 1 ? "round" : "rounds";
}

function renderQuestion(team) {
    const question = game.questions[team];
    const equation = $(`${team}-question`);
    equation.replaceChildren(document.createTextNode(`${question.text} `));
    const unknown = document.createElement("span");
    unknown.textContent = "= ?";
    equation.append(unknown);
    const accessibleSymbols = {
        "+": "plus",
        "−": "minus",
        "×": "times",
        "÷": "divided by",
    };
    equation.setAttribute(
        "aria-label",
        `${question.a} ${accessibleSymbols[question.symbol]} ${question.b} equals what?`,
    );
    $(`${team}-answers`)
        .querySelectorAll("button")
        .forEach((button, index) => {
            button.querySelector(".answer-value").textContent =
                question.answers[index];
            button.setAttribute(
                "aria-label",
                `${labels[team]} team: answer ${question.answers[index]}, key ${button.querySelector("kbd").textContent}`,
            );
            button.classList.remove("correct", "incorrect", "answer-revealed");
        });
    $(`${team}-panel`).classList.remove("is-reviewing");
}

function renderScores() {
    $("round-label").textContent =
        `ROUND ${game.round} OF ${game.settings.rounds}`;
    for (const team of teams) {
        $(`${team}-points`).textContent = game.points[team];
        $(`${team}-points`).parentElement.lastChild.textContent =
            game.points[team] === 1 ? " point" : " points";
        $(`${team}-wins`).textContent = game.wins[team];
        $(`${team}-streak`).hidden = game.streaks[team] < 3;
        $(`${team}-streak`).textContent = game.streaks[team];
        $(`${team}-panel`).classList.toggle(
            "has-streak",
            game.streaks[team] >= 3,
        );
    }
    const offset = (game.position / PULLS_TO_WIN) * 190;
    $("tug-movers").style.setProperty("--pull", `${offset}px`);
    const positionDescription =
        game.position === 0
            ? "The ribbon is at the center."
            : `${labels[game.position < 0 ? "red" : "blue"]} team leads by ${Math.abs(game.position)} pulls.`;
    document
        .querySelector(".tug-scene")
        .setAttribute("aria-label", positionDescription);
    $("pull-meter").style.setProperty(
        "--pull-percent",
        `${50 + (game.position / PULLS_TO_WIN) * 50}%`,
    );
    $("pull-meter").setAttribute("aria-valuenow", game.position);
    $("pull-meter").setAttribute("aria-valuetext", positionDescription);
    $("arena-heading").textContent =
        game.phase === "playing"
            ? game.position === 0
                ? "NECK AND NECK. KEEP PULLING!"
                : `${labels[game.position < 0 ? "red" : "blue"].toUpperCase()} NEEDS ${Math.max(0, PULLS_TO_WIN - Math.abs(game.position))} MORE PULLS!`
            : "A LITTLE MATH. A BIG PULL.";
}

function renderTimer() {
    const seconds = Math.ceil(game.remainingMs / 1000);
    if (lastSecond === seconds) return;
    lastSecond = seconds;
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    $("timer-value").textContent =
        `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    $("timer").setAttribute(
        "aria-label",
        `Time remaining: ${minutes} minutes ${remainder} seconds`,
    );
    $("timer").classList.toggle("urgent", seconds <= 15);
    if (seconds <= 5 && seconds > 0 && game.phase === "playing")
        sound(420, 0.07);
}

function setOverlay({
    eyebrow = "",
    symbol = "",
    title = "",
    copy = "",
    action = "",
    style = "",
}) {
    overlay.hidden = false;
    $("overlay-panel").className = `overlay-panel ${style}`;
    $("overlay-eyebrow").textContent = eyebrow;
    $("overlay-symbol").replaceChildren();
    if (symbol === "trophy") {
        const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
        );
        const use = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "use",
        );
        use.setAttribute("href", "#icon-trophy");
        svg.append(use);
        $("overlay-symbol").append(svg);
    } else $("overlay-symbol").textContent = symbol;
    $("overlay-title").textContent = title;
    $("overlay-copy").textContent = copy;
    $("overlay-action").hidden = !action;
    $("overlay-action").textContent = action;
}

function renderPhase() {
    if (lastRenderedPhase === game.phase) return;
    lastRenderedPhase = game.phase;
    $("arena").dataset.phase = game.phase;
    const active = game.phase !== "ready";
    $("game-screen").hidden = !active;
    const controlsParent = active
        ? $("match-toolbar-slot")
        : $("header-controls-home");
    if ($("header-actions").parentElement !== controlsParent)
        controlsParent.append($("header-actions"));
    $("settings-fields").disabled = game.phase !== "ready";
    $("reset-button").disabled = game.phase === "ready";
    $("restart-button").disabled = game.phase === "ready";
    $("pause-actions").hidden = game.phase !== "paused";
    const status = {
        ready: "Ready to rumble",
        countdown: "Get ready…",
        playing: "Match in progress",
        paused: "Taking a breather",
        "round-over": "Round complete",
        "match-over": "Match complete",
    }[game.phase];
    $("match-status").lastChild.textContent = ` ${status}`;
    $("match-status").classList.toggle("active", game.phase === "playing");
    $("start-label").textContent = {
        ready: "Start the rumble",
        countdown: "Get ready…",
        playing: "Pause game",
        paused: "Resume game",
        "round-over": "Next round",
        "match-over": "Play again",
    }[game.phase];
    $("start-icon")
        .querySelector("use")
        .setAttribute(
            "href",
            game.phase === "playing" ? "#icon-pause" : "#icon-arrow",
        );
    $("start-button").disabled = game.phase === "countdown";
    document.body.classList.toggle("match-active", active);
    syncMusic();
    schedulePlayFit();
    if (game.phase === "ready" || game.phase === "playing")
        overlay.hidden = true;
    if (game.phase === "paused") {
        setOverlay({
            eyebrow: "TAKE YOUR TIME",
            symbol: "Ⅱ",
            title: "A little breather.",
            copy: "Your match is right where you left it.",
            action: "Resume the rumble",
        });
        announce("Game paused. Resume when you are ready.");
    }
    if (game.phase === "round-over" || game.phase === "match-over")
        renderResult();
    renderScores();
}

function renderButtons(now) {
    for (const team of teams) {
        const disabled =
            game.phase !== "playing" || now < game.cooldownUntil[team];
        $(`${team}-answers`)
            .querySelectorAll("button")
            .forEach((button) => {
                button.disabled = disabled;
            });
    }
}

function clearFeedback() {
    $("arena").classList.remove("is-pulling-red", "is-pulling-blue");
    for (const team of teams) {
        feedbackStates[team] = null;
        $(`${team}-pull-pop`).classList.remove("is-popping");
        const feedback = $(`${team}-feedback`);
        feedback.className = "team-feedback";
        feedback.textContent = `Tap or press ${team === "red" ? "A · S · D" : "J · K · L"}`;
        $(`${team}-caption`).textContent = "YOUR NEXT BIG PULL";
    }
}

function renderFeedback(now) {
    if (game.phase !== "playing") return;
    for (const team of teams) {
        if (!feedbackStates[team] || now < game.cooldownUntil[team]) continue;
        const wasMistake = !feedbackStates[team].correct;
        feedbackStates[team] = null;
        renderQuestion(team);
        $(`${team}-caption`).textContent = "YOUR NEXT BIG PULL";
        if (wasMistake) {
            $(`${team}-feedback`).className = "team-feedback";
            $(`${team}-feedback`).textContent =
                "Your turn! Try this next question.";
        }
    }
}

function previewSettings() {
    if (game.phase !== "ready") return;
    updateNumberSuggestions();
    if (!form.checkValidity()) return;
    const settings = readSettings();
    game.reset(settings);
    saveStorage(storageKey, JSON.stringify(settings));
    updateDifficultyHint();
    teams.forEach(renderQuestion);
    renderScores();
    lastSecond = -1;
    renderTimer();
}

function beginCountdown(duration = 3000) {
    if (resultsDialog.open) resultsDialog.close();
    clearFeedback();
    teams.forEach(renderQuestion);
    game.phase = "countdown";
    countdownEnd = performance.now() + duration;
    lastCountdownNumber = null;
    renderPhase();
    window.scrollTo(0, 0);
    $("game-screen").focus({ preventScroll: true });
    schedulePlayFit();
    announce(`Round ${game.round}. Get ready, Red and Blue teams.`);
}

function pause() {
    const now = performance.now();
    if (game.phase === "countdown") {
        countdownRemaining = Math.max(0, countdownEnd - now);
        pausedDuringCountdown = true;
        game.phase = "paused";
    } else {
        pausedDuringCountdown = false;
        game.pause(now);
    }
    renderPhase();
    renderButtons(now);
}

function resume() {
    if (document.hidden || helpDialog.open || resetDialog.open) return;
    if (pausedDuringCountdown) {
        pausedDuringCountdown = false;
        beginCountdown(countdownRemaining);
    } else {
        game.resume(performance.now());
        renderPhase();
    }
}

function newMatch() {
    if (resultsDialog.open) resultsDialog.close();
    game.reset(readSettings());
    pausedDuringCountdown = false;
    clearFeedback();
    teams.forEach(renderQuestion);
    lastRenderedPhase = "";
    lastSecond = -1;
    renderPhase();
    renderTimer();
    updateNumberSuggestions();
    window.scrollTo(0, 0);
    $("settings-heading").focus({ preventScroll: true });
    announce("New match. Choose your challenge and start the rumble.");
}

function restartMatch() {
    music.stop();
    game.reset();
    pausedDuringCountdown = false;
    countdownRemaining = 3000;
    lastRenderedPhase = "";
    lastSecond = -1;
    renderTimer();
    beginCountdown();
}

function requestGameReset(action) {
    if (game.phase === "ready" || resetDialog.open) return;
    pendingResetAction = action;
    resetWasActive = ["playing", "countdown"].includes(game.phase);
    if (resetWasActive) pause();
    const restarting = action === "restart";
    $("reset-title").textContent = restarting
        ? "Restart this game?"
        : "New game?";
    $("reset-copy").textContent = restarting
        ? "Start again from round 1 with the same settings. Your scores and round wins will be cleared."
        : "Your scores and round wins will be cleared. Return to Choose your adventure to pick new settings.";
    $("confirm-reset").textContent = restarting ? "Restart game" : "New game";
    resetDialog.returnValue = "cancel";
    resetDialog.showModal();
}

function primaryAction() {
    if (game.phase === "ready") {
        if (!form.reportValidity()) return;
        game.reset(readSettings());
        saveStorage(storageKey, JSON.stringify(game.settings));
        // Initialize audio from a user gesture before the countdown.
        sound(440, 0.025);
        beginCountdown();
    } else if (game.phase === "playing") pause();
    else if (game.phase === "paused") resume();
    else if (game.phase === "round-over") {
        game.nextRound();
        lastSecond = -1;
        renderTimer();
        beginCountdown();
    } else if (game.phase === "match-over") {
        restartMatch();
    }
}

function clearConfetti() {
    clearTimeout(confettiTimeout);
    resultsDialog.querySelector(".confetti-layer")?.remove();
}

function celebrate(team, finished) {
    clearConfetti();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors =
        team === "red"
            ? ["#ff607b", "#ffcf48", "#ad83f5", "#51c9b4"]
            : ["#448cf3", "#ffcf48", "#ad83f5", "#51c9b4"];
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    layer.setAttribute("aria-hidden", "true");
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = finished ? (width < 600 ? 80 : 110) : 64;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement("span");
        const fromLeft = i % 2 === 0;
        const direction = fromLeft ? 1 : -1;
        const drift = direction * width * (0.15 + Math.random() * 0.5);
        const spin = direction * (360 + Math.random() * 720);
        piece.className = `confetti-piece confetti-${i % 3 === 0 ? "star" : i % 3 === 1 ? "round" : "ribbon"}`;
        piece.style.left = `${(fromLeft ? 5 : 85) + Math.random() * 10}%`;
        piece.style.top = `${65 + Math.random() * 15}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDelay = `${Math.random() * 0.35}s`;
        piece.style.animationDuration = `${(finished ? 3.2 : 2.4) + Math.random() * 0.8}s`;
        piece.style.setProperty("--drift", `${drift}px`);
        piece.style.setProperty("--drift-middle", `${drift * 0.6}px`);
        piece.style.setProperty(
            "--rise",
            `${-height * (0.35 + Math.random() * 0.4)}px`,
        );
        piece.style.setProperty("--fall", `${height * 0.65}px`);
        piece.style.setProperty("--spin", `${spin}deg`);
        piece.style.setProperty("--spin-middle", `${spin * 0.45}deg`);
        piece.style.setProperty("--size", `${7 + Math.random() * 6}px`);
        layer.append(piece);
    }
    layer.addEventListener("animationend", (event) => {
        event.target.remove();
        if (!layer.childElementCount) clearConfetti();
    });
    resultsDialog.append(layer);
    confettiTimeout = setTimeout(clearConfetti, finished ? 4700 : 3900);
}

function renderResult() {
    const finished = game.phase === "match-over";
    const winner = finished ? game.winner : game.roundWinner;
    const title = winner
        ? `${labels[winner]} Team ${finished ? "takes the crown!" : "wins the round!"}`
        : finished
          ? "An evenly matched match!"
          : "A perfect tug-of-tie!";
    const copy = finished
        ? `Rounds won: Red ${game.wins.red} · Blue ${game.wins.blue}. ${game.totalPoints.red + game.totalPoints.blue} right answers. That's teamwork.`
        : `Round ${game.round} complete. ${game.settings.rounds - game.round} ${game.settings.rounds - game.round === 1 ? "round" : "rounds"} left to play.`;
    overlay.hidden = true;
    const stats = game.getStats(finished ? "match" : "round");
    $("results-eyebrow").textContent = finished
        ? "THAT’S A WRAP"
        : `ROUND ${game.round} COMPLETE`;
    $("results-title").textContent = title;
    $("results-copy").textContent = copy;
    $("results-scope").textContent = finished
        ? "Your answers and accuracy for the whole match."
        : "This round’s answers and accuracy. Round wins are for the match.";
    for (const team of teams) {
        $(`${team}-result-correct`).textContent = stats[team].correct;
        $(`${team}-result-accuracy`).textContent =
            stats[team].accuracy === null ? "—" : `${stats[team].accuracy}%`;
        $(`${team}-result-wins`).textContent = stats[team].roundsWon;
        $(`${team}-result-attempts`).textContent = stats[team].attempts
            ? `${stats[team].correct} correct out of ${stats[team].attempts} answered`
            : "No answers yet";
    }
    $("results-action").textContent = finished ? "Play again" : "Next round →";
    $("results-restart").hidden = finished;
    resultsDialog.className = `results-dialog ${winner ? `winner-${winner}` : ""}`;
    if (!resultsDialog.open) resultsDialog.showModal();
    announce(`${title} ${copy}`);
    if (winner) {
        celebrate(winner, finished);
        sound(523, 0.18);
        setTimeout(() => sound(659, 0.2), 140);
        setTimeout(() => sound(784, 0.3), 280);
    }
}

function submitAnswer(team, index) {
    if (helpDialog.open || resetDialog.open || resultsDialog.open) return;
    const now = performance.now();
    if (
        feedbackStates[team] &&
        game.phase === "playing" &&
        now >= game.cooldownUntil[team]
    ) {
        renderFeedback(now);
        return;
    }
    const result = game.answer(team, index, now);
    if (!result) {
        renderPhase();
        return;
    }
    const button = $(`${team}-answers`).querySelector(
        `[data-index="${index}"]`,
    );
    button.classList.add(result.correct ? "correct" : "incorrect");
    const feedback = $(`${team}-feedback`);
    feedback.className = `team-feedback ${result.correct ? "is-correct" : "is-incorrect"}`;
    feedback.textContent = result.correct
        ? game.streaks[team] >= 3
            ? `${game.streaks[team]} in a row! You're on a roll.`
            : "Nice one! Keep pulling!"
        : `Correct: ${result.question.text} = ${result.correctAnswer}.`;
    $(`${team}-caption`).textContent = result.correct
        ? "THAT’S BRAIN POWER!"
        : "LET’S LEARN THIS ONE";
    if (!result.correct) {
        $(`${team}-panel`).classList.add("is-reviewing");
        $(`${team}-answers`)
            .querySelector(`[data-index="${result.question.correctIndex}"]`)
            .classList.add("answer-revealed");
        const solution = document.createElement("span");
        solution.textContent = ` = ${result.correctAnswer}`;
        $(`${team}-question`).replaceChildren(
            document.createTextNode(result.question.text),
            solution,
        );
        $(`${team}-question`).setAttribute(
            "aria-label",
            `Correct answer: ${result.question.text} equals ${result.correctAnswer}`,
        );
    }
    if (result.correct) {
        showPullPop(team);
        $("arena").classList.remove(`is-pulling-${team}`);
        void $("arena").offsetWidth;
        $("arena").classList.add(`is-pulling-${team}`);
        sound(team === "red" ? 587 : 698, 0.13);
    } else sound(180, 0.13, "triangle");
    feedbackStates[team] = result;
    renderScores();
    renderPhase();
    renderButtons(now);
}

function frame(now) {
    if (game.phase === "countdown") {
        const number = Math.ceil((countdownEnd - now) / 1000);
        if (number <= 0) {
            game.start(now);
            sound(880, 0.18);
            announce("Go! Solve your questions and pull the rope.");
        } else if (number !== lastCountdownNumber) {
            lastCountdownNumber = number;
            setOverlay({
                eyebrow: `ROUND ${game.round} · RED VS BLUE`,
                symbol: String(number),
                title: "Ready to rumble?",
                copy: "Red: A S D     ·     Blue: J K L",
                style: "is-countdown",
            });
            sound(440, 0.07);
        }
    }
    game.tick(now);
    renderFeedback(now);
    renderTimer();
    renderPhase();
    renderButtons(now);
    requestAnimationFrame(frame);
}

form.addEventListener("submit", (event) => {
    event.preventDefault();
    primaryAction();
});
form.addEventListener("change", previewSettings);
form.addEventListener("input", (event) => {
    if (event.target.matches('input[type="number"]')) updateNumberSuggestions();
    clearTimeout(previewTimeout);
    previewTimeout = setTimeout(previewSettings, 150);
});
form.querySelectorAll("[data-number-suggestion]").forEach((suggestion) =>
    suggestion.addEventListener("change", () => {
        const input = $(suggestion.dataset.numberSuggestion);
        const custom = suggestion.value === "custom";
        if (!custom) input.value = suggestion.value;
        updateNumberSuggestions();
        if (custom) {
            input.focus();
            input.select();
        }
    }),
);
document
    .querySelectorAll(".answer-button")
    .forEach((button) =>
        button.addEventListener("click", () =>
            submitAnswer(button.dataset.team, Number(button.dataset.index)),
        ),
    );
document.querySelectorAll(".answer-button").forEach((button) => {
    button.addEventListener("pointerdown", (event) =>
        addTapRipple(button, event),
    );
});
$("overlay-action").addEventListener("click", primaryAction);
$("results-action").addEventListener("click", primaryAction);
$("results-settings").addEventListener("click", newMatch);
$("results-restart").addEventListener("click", restartMatch);
resultsDialog.addEventListener("cancel", (event) => event.preventDefault());
resultsDialog.addEventListener("close", clearConfetti);
$("sound-button").addEventListener("click", () => {
    soundOn = !soundOn;
    saveStorage(soundKey, String(soundOn));
    syncSoundButton();
    sound(600, 0.1);
});
$("music-button").addEventListener("click", () => {
    musicOn = !musicOn;
    saveStorage(musicKey, String(musicOn));
    syncMusic();
});
$("fullscreen-button").addEventListener("click", async () => {
    try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
    } catch {
        $("fullscreen-button").title =
            "Fullscreen is unavailable in this browser";
    }
    syncFullscreen();
});
document.addEventListener("fullscreenchange", syncFullscreen);
$("help-button").addEventListener("click", () => {
    if (["playing", "countdown"].includes(game.phase)) pause();
    helpDialog.showModal();
});
for (const id of ["close-help", "help-done"])
    $(id).addEventListener("click", () => helpDialog.close());
document
    .querySelectorAll("[data-reset-action]")
    .forEach((button) =>
        button.addEventListener("click", () =>
            requestGameReset(button.dataset.resetAction),
        ),
    );
$("cancel-reset").addEventListener("click", () => resetDialog.close("cancel"));
$("confirm-reset").addEventListener("click", () =>
    resetDialog.close("confirm"),
);
resetDialog.addEventListener("close", () => {
    const action = pendingResetAction;
    const shouldResume = resetWasActive;
    pendingResetAction = null;
    resetWasActive = false;
    if (resetDialog.returnValue === "confirm") {
        if (action === "restart") restartMatch();
        else if (action === "new-game") newMatch();
    } else if (shouldResume) resume();
});
for (const dialog of [helpDialog, resetDialog])
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            const rect = dialog.getBoundingClientRect();
            if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            )
                dialog.close("cancel");
        }
    });
document.addEventListener("keydown", (event) => {
    if (
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        helpDialog.open ||
        resetDialog.open ||
        resultsDialog.open
    )
        return;
    if (event.key === "Escape") {
        if (["playing", "countdown"].includes(game.phase)) {
            event.preventDefault();
            pause();
        } else if (game.phase === "paused") {
            event.preventDefault();
            resume();
        }
        return;
    }
    if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
            document.activeElement?.tagName,
        ) ||
        document.activeElement?.isContentEditable
    )
        return;
    const answer = answerKeys[event.key.toLowerCase()];
    if (answer && game.phase === "playing") {
        event.preventDefault();
        const button = $(`${answer[0]}-answers`).querySelector(
            `[data-index="${answer[1]}"]`,
        );
        if (!button.disabled) {
            button.classList.add("is-key-down");
            addTapRipple(button);
        }
        submitAnswer(...answer);
    }
});
document.addEventListener("keyup", (event) => {
    const answer = answerKeys[event.key.toLowerCase()];
    if (answer)
        $(`${answer[0]}-answers`)
            .querySelector(`[data-index="${answer[1]}"]`)
            .classList.remove("is-key-down");
});
window.addEventListener("blur", () => {
    document
        .querySelectorAll(".is-key-down")
        .forEach((button) => button.classList.remove("is-key-down"));
});
document.addEventListener("visibilitychange", () => {
    if (document.hidden && ["playing", "countdown"].includes(game.phase))
        pause();
    syncMusic();
});
window.addEventListener("pagehide", () => {
    if (["playing", "countdown"].includes(game.phase)) pause();
    music.stop();
});
window.addEventListener("resize", schedulePlayFit);
window.visualViewport?.addEventListener("resize", schedulePlayFit);
if ("ResizeObserver" in window) {
    const layoutObserver = new ResizeObserver(schedulePlayFit);
    for (const element of document.querySelectorAll(
        ".team-panels, .settings-card, .site-header",
    )) {
        layoutObserver.observe(element);
    }
}

writeSettings(game.settings);
syncSoundButton();
syncFullscreen();
teams.forEach(renderQuestion);
renderScores();
renderPhase();
renderTimer();
clearFeedback();
requestAnimationFrame(frame);
