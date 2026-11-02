export const OPERATIONS = [
    "addition",
    "subtraction",
    "multiplication",
    "division",
];
export const DIFFICULTIES = ["easy", "medium", "hard"];
export const PULLS_TO_WIN = 6;
export const CORRECT_ANSWER_COOLDOWN_MS = 280;
export const MISTAKE_REVIEW_MS = 2000;

const DIFFICULTY_PREVIEWS = {
    addition: [
        ["6 + 3 = 9", "Add numbers from 1 to 10."],
        ["18 + 7 = 25", "Add numbers from 1 to 30."],
        ["47 + 38 = 85", "Add numbers from 1 to 100."],
    ],
    subtraction: [
        ["9 − 4 = 5", "Subtract numbers up to 10."],
        ["24 − 9 = 15", "Subtract numbers up to 30."],
        ["83 − 46 = 37", "Subtract numbers up to 100."],
    ],
    multiplication: [
        ["3 × 4 = 12", "Practice your 1 to 5 times tables."],
        ["7 × 8 = 56", "Practice your 1 to 10 times tables."],
        ["12 × 17 = 204", "Multiply numbers up to 12 by numbers up to 20."],
    ],
    division: [
        ["12 ÷ 3 = 4", "Divide using your 1 to 5 times tables."],
        ["56 ÷ 7 = 8", "Divide using your 1 to 10 times tables."],
        ["204 ÷ 12 = 17", "Divide by up to 12, with answers up to 20."],
    ],
    mixed: [
        ["6 + 3 = 9", "All four types, with small numbers."],
        ["7 × 8 = 56", "All four types, with a bigger challenge."],
        ["204 ÷ 12 = 17", "All four types, with our biggest numbers."],
    ],
};

export function getDifficultyPreview(operation, difficulty) {
    const previews =
        DIFFICULTY_PREVIEWS[operation] || DIFFICULTY_PREVIEWS.addition;
    const [example, description] =
        previews[Math.max(0, DIFFICULTIES.indexOf(difficulty))];
    return { example, description };
}

function shuffleChoices(choices, random) {
    const shuffled = [...choices];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function normalizeSettings(input = {}) {
    const integer = (value, fallback, min, max) => {
        const number = Number(value);
        return Number.isFinite(number)
            ? Math.min(max, Math.max(min, Math.round(number)))
            : fallback;
    };
    return {
        operation: [...OPERATIONS, "mixed"].includes(input.operation)
            ? input.operation
            : "addition",
        difficulty: DIFFICULTIES.includes(input.difficulty)
            ? input.difficulty
            : "easy",
        minutes: integer(input.minutes ?? 5, 5, 1, 60),
        rounds: integer(input.rounds ?? 3, 3, 1, 15),
    };
}

export function createQuestion(settings, random = Math.random) {
    const integer = (min, max) => Math.floor(random() * (max - min + 1)) + min;
    const level = DIFFICULTIES.indexOf(settings.difficulty);
    const operation =
        settings.operation === "mixed"
            ? OPERATIONS[integer(0, 3)]
            : settings.operation;
    const max = [10, 30, 100][level];
    let a = integer(1, max);
    let b = integer(1, max);
    let answer;
    let symbol;
    switch (operation) {
        case "subtraction":
            [a, b] = [Math.max(a, b), Math.min(a, b)];
            answer = a - b;
            symbol = "−";
            break;
        case "multiplication":
            a = integer(1, [5, 10, 12][level]);
            b = integer(1, [5, 10, 20][level]);
            answer = a * b;
            symbol = "×";
            break;
        case "division":
            b = integer(1, [5, 10, 12][level]);
            answer = integer(1, [5, 10, 20][level]);
            a = answer * b;
            symbol = "÷";
            break;
        default:
            answer = a + b;
            symbol = "+";
    }
    const choices = new Set([answer]);
    // A bounded loop also handles a deterministic random source in tests.
    for (let attempt = 0; choices.size < 3 && attempt < 30; attempt++) {
        const offset = integer(1, Math.max(3, Math.ceil(answer / 4)));
        const distractor = answer + (random() < 0.5 ? -offset : offset);
        if (distractor >= 0) choices.add(distractor);
    }
    for (let offset = 1; choices.size < 3; offset++)
        choices.add(answer + offset);
    const answers = [...choices];
    for (let i = answers.length - 1; i > 0; i--) {
        const j = integer(0, i);
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return {
        a,
        b,
        symbol,
        operation,
        text: `${a} ${symbol} ${b}`,
        answers,
        correctIndex: answers.indexOf(answer),
    };
}

export class RumbleGame {
    constructor(settings = {}, random = Math.random) {
        this.random = random;
        this.reset(settings);
    }

    reset(settings = this.settings) {
        this.settings = normalizeSettings(settings);
        this.phase = "ready";
        this.round = 1;
        this.wins = { red: 0, blue: 0 };
        this.totalPoints = { red: 0, blue: 0 };
        this.totalAttempts = { red: 0, blue: 0 };
        this.roundResults = [];
        this.prepareRound();
    }

    prepareRound() {
        this.position = 0;
        this.points = { red: 0, blue: 0 };
        this.streaks = { red: 0, blue: 0 };
        this.attempts = { red: 0, blue: 0 };
        this.cooldownUntil = { red: 0, blue: 0 };
        this.questionBank = new Map();
        this.questionIndices = { red: 0, blue: 0 };
        this.questions = {
            red: this.questionFor("red"),
            blue: this.questionFor("blue"),
        };
        this.remainingMs = this.settings.minutes * 60_000;
        this.roundWinner = null;
        this.winner = null;
        this.deadline = null;
    }

    questionFor(team) {
        const index = this.questionIndices[team];
        if (!this.questionBank.has(index)) {
            this.questionBank.set(
                index,
                createQuestion(this.settings, this.random),
            );
        }
        const original = this.questionBank.get(index);
        const correctAnswer = original.answers[original.correctIndex];
        const answers = shuffleChoices(original.answers, this.random);
        return {
            ...original,
            answers,
            correctIndex: answers.indexOf(correctAnswer),
        };
    }

    advanceQuestion(team) {
        this.questionIndices[team]++;
        this.questions[team] = this.questionFor(team);
        const consumed = Math.min(
            this.questionIndices.red,
            this.questionIndices.blue,
        );
        for (const index of this.questionBank.keys()) {
            if (index < consumed) this.questionBank.delete(index);
        }
    }

    getStats(scope = "match") {
        const correct = scope === "round" ? this.points : this.totalPoints;
        const attempts = scope === "round" ? this.attempts : this.totalAttempts;
        return Object.fromEntries(
            ["red", "blue"].map((team) => [
                team,
                {
                    correct: correct[team],
                    attempts: attempts[team],
                    accuracy: attempts[team]
                        ? Math.round((correct[team] / attempts[team]) * 100)
                        : null,
                    roundsWon: this.wins[team],
                },
            ]),
        );
    }

    start(now) {
        if (!["ready", "countdown"].includes(this.phase)) return;
        this.phase = "playing";
        this.deadline = now + this.remainingMs;
    }

    answer(team, index, now) {
        if (
            !["red", "blue"].includes(team) ||
            !Number.isInteger(index) ||
            index < 0 ||
            index > 2
        )
            return null;
        this.tick(now);
        if (this.phase !== "playing" || now < this.cooldownUntil[team])
            return null;
        const question = this.questions[team];
        const correctAnswer = question.answers[question.correctIndex];
        const correct = index === question.correctIndex;
        this.attempts[team]++;
        this.totalAttempts[team]++;
        this.cooldownUntil[team] =
            now + (correct ? CORRECT_ANSWER_COOLDOWN_MS : MISTAKE_REVIEW_MS);
        if (correct) {
            this.points[team]++;
            this.totalPoints[team]++;
            this.streaks[team]++;
            this.position += team === "red" ? -1 : 1;
        } else {
            this.streaks[team] = 0;
        }
        this.advanceQuestion(team);
        if (Math.abs(this.position) >= PULLS_TO_WIN) this.finishRound(team);
        return { correct, team, index, question, correctAnswer };
    }

    tick(now) {
        if (this.phase !== "playing") return;
        this.remainingMs = Math.max(0, this.deadline - now);
        if (this.remainingMs === 0) {
            this.finishRound(
                this.position < 0 ? "red" : this.position > 0 ? "blue" : null,
            );
        }
    }

    pause(now) {
        this.tick(now);
        if (this.phase !== "playing") return false;
        this.phase = "paused";
        this.pauseStartedAt = now;
        return true;
    }

    resume(now) {
        if (this.phase !== "paused") return;
        const elapsed = now - this.pauseStartedAt;
        for (const team of ["red", "blue"]) this.cooldownUntil[team] += elapsed;
        this.deadline = now + this.remainingMs;
        this.phase = "playing";
    }

    finishRound(winner) {
        this.roundWinner = winner;
        this.roundResults.push(winner);
        if (winner) this.wins[winner]++;
        const majority = Math.floor(this.settings.rounds / 2) + 1;
        const finished =
            this.round >= this.settings.rounds ||
            this.wins.red >= majority ||
            this.wins.blue >= majority;
        this.phase = finished ? "match-over" : "round-over";
        if (finished)
            this.winner =
                this.wins.red === this.wins.blue
                    ? null
                    : this.wins.red > this.wins.blue
                      ? "red"
                      : "blue";
    }

    nextRound() {
        if (this.phase !== "round-over") return false;
        this.round++;
        this.prepareRound();
        this.phase = "countdown";
        return true;
    }
}
