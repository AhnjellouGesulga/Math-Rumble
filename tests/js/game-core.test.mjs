import test from "node:test";
import assert from "node:assert/strict";
import {
    RumbleGame,
    createQuestion,
    normalizeSettings,
    OPERATIONS,
    DIFFICULTIES,
    PULLS_TO_WIN,
    MISTAKE_REVIEW_MS,
    getDifficultyPreview,
} from "../../public/js/game-core.mjs";

function seededRandom(seed = 72) {
    return () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
}

function winRound(game, team, start = 0) {
    game.start(start);
    for (let i = 0; i < PULLS_TO_WIN; i++)
        game.answer(team, game.questions[team].correctIndex, start + i * 300);
}

test("teams receive the same mixed question sequence even when one team moves ahead", () => {
    const game = new RumbleGame(
        { operation: "mixed", difficulty: "hard", minutes: 60 },
        seededRandom(),
    );
    game.start(0);
    const redSequence = [];
    for (let index = 0; index < 30; index++) {
        redSequence.push(game.questions.red.text);
        game.answer(
            "red",
            (game.questions.red.correctIndex + 1) % 3,
            index * MISTAKE_REVIEW_MS,
        );
    }
    const blueSequence = [];
    for (let index = 0; index < 30; index++) {
        blueSequence.push(game.questions.blue.text);
        game.answer(
            "blue",
            (game.questions.blue.correctIndex + 1) % 3,
            60000 + index * MISTAKE_REVIEW_MS,
        );
    }
    assert.deepEqual(blueSequence, redSequence);
    assert.equal(game.questions.red.text, game.questions.blue.text);
    assert.equal(game.questionBank.size, 1);
    assert.ok(redSequence.some((question) => question.includes("×")));
    assert.ok(redSequence.some((question) => question.includes("÷")));
});

test("each team has its own answer array with the correct answer preserved", () => {
    const game = new RumbleGame({ operation: "mixed" }, seededRandom());
    assert.equal(game.questions.red.text, game.questions.blue.text);
    assert.notEqual(game.questions.red.answers, game.questions.blue.answers);
    assert.equal(
        game.questions.red.answers[game.questions.red.correctIndex],
        game.questions.blue.answers[game.questions.blue.correctIndex],
    );
    const originalBlueAnswers = [...game.questions.blue.answers];
    game.questions.red.answers.reverse();
    assert.deepEqual(game.questions.blue.answers, originalBlueAnswers);
});

test("wrong answers return the solved question and allow time to read it", () => {
    const game = new RumbleGame();
    game.start(0);
    const question = game.questions.red;
    const result = game.answer("red", (question.correctIndex + 1) % 3, 0);
    assert.equal(result.question, question);
    assert.equal(result.correctAnswer, question.answers[question.correctIndex]);
    assert.equal(game.cooldownUntil.red, MISTAKE_REVIEW_MS);
    assert.equal(game.totalAttempts.red, 1);
    assert.equal(game.totalPoints.red, 0);
});

test("results distinguish round accuracy from cumulative match accuracy", () => {
    const game = new RumbleGame({ rounds: 3 });
    winRound(game, "red");
    game.nextRound();
    game.start(3000);
    game.answer("red", (game.questions.red.correctIndex + 1) % 3, 3000);
    game.answer("blue", game.questions.blue.correctIndex, 3000);
    game.answer(
        "red",
        game.questions.red.correctIndex,
        3000 + MISTAKE_REVIEW_MS,
    );
    assert.deepEqual(game.getStats().red, {
        correct: 7,
        attempts: 8,
        accuracy: 88,
        roundsWon: 1,
    });
    assert.deepEqual(game.getStats("round").red, {
        correct: 1,
        attempts: 2,
        accuracy: 50,
        roundsWon: 1,
    });
    assert.deepEqual(game.getStats().blue, {
        correct: 1,
        attempts: 1,
        accuracy: 100,
        roundsWon: 0,
    });
    game.reset();
    assert.deepEqual(game.getStats().red, {
        correct: 0,
        attempts: 0,
        accuracy: null,
        roundsWon: 0,
    });
});

test("every difficulty has an accurate example for every math mode", () => {
    for (const operation of [...OPERATIONS, "mixed"]) {
        for (const difficulty of DIFFICULTIES) {
            const preview = getDifficultyPreview(operation, difficulty);
            const [left, symbol, right, , answer] = preview.example.split(" ");
            const value = {
                "+": () => +left + +right,
                "−": () => +left - +right,
                "×": () => +left * +right,
                "÷": () => +left / +right,
            }[symbol]();
            assert.equal(value, Number(answer));
            assert.ok(preview.description.length > 10);
        }
    }
});

test("every operation and difficulty produces valid questions with unique nonnegative choices", () => {
    const random = seededRandom();
    for (const operation of [...OPERATIONS, "mixed"]) {
        for (const difficulty of DIFFICULTIES) {
            for (let i = 0; i < 200; i++) {
                const question = createQuestion(
                    { operation, difficulty },
                    random,
                );
                const expected = {
                    addition: () => question.a + question.b,
                    subtraction: () => question.a - question.b,
                    multiplication: () => question.a * question.b,
                    division: () => question.a / question.b,
                }[question.operation]();
                assert.equal(question.answers[question.correctIndex], expected);
                assert.equal(new Set(question.answers).size, 3);
                assert.ok(
                    question.answers.every(
                        (choice) => Number.isInteger(choice) && choice >= 0,
                    ),
                );
                if (operation !== "mixed")
                    assert.equal(question.operation, operation);
            }
        }
    }
});

test("question generation terminates even with a fixed random source", () => {
    const question = createQuestion(
        { operation: "subtraction", difficulty: "easy" },
        () => 0,
    );
    assert.equal(new Set(question.answers).size, 3);
    assert.equal(question.answers[question.correctIndex], 0);
});

test("settings respect the brief’s limits and reject unknown modes", () => {
    assert.deepEqual(
        normalizeSettings({
            operation: "<script>",
            difficulty: "extreme",
            minutes: 0,
            rounds: 90,
        }),
        { operation: "addition", difficulty: "easy", minutes: 1, rounds: 15 },
    );
    assert.equal(normalizeSettings({ minutes: 100 }).minutes, 60);
    assert.equal(normalizeSettings({ rounds: 2 }).rounds, 2);
    assert.equal(normalizeSettings({ minutes: "oops" }).minutes, 5);
    assert.equal(normalizeSettings().rounds, 3);
});

test("answers are ignored before starting, while paused, and after a win", () => {
    const game = new RumbleGame({ rounds: 1 });
    assert.equal(game.answer("red", game.questions.red.correctIndex, 0), null);
    game.start(0);
    game.pause(100);
    assert.equal(
        game.answer("red", game.questions.red.correctIndex, 200),
        null,
    );
    game.resume(300);
    for (let i = 0; i < 6; i++)
        game.answer("red", game.questions.red.correctIndex, 300 + i * 300);
    assert.equal(game.phase, "match-over");
    assert.equal(
        game.answer("blue", game.questions.blue.correctIndex, 2500),
        null,
    );
    assert.deepEqual(game.wins, { red: 1, blue: 0 });
});

test("correct answers move in opposite directions and update scores", () => {
    const game = new RumbleGame();
    game.start(0);
    game.answer("red", game.questions.red.correctIndex, 0);
    assert.equal(game.position, -1);
    game.answer("blue", game.questions.blue.correctIndex, 0);
    assert.equal(game.position, 0);
    assert.deepEqual(game.points, { red: 1, blue: 1 });
});

test("wrong answers enforce an independent cooldown without moving the rope", () => {
    const game = new RumbleGame();
    game.start(0);
    game.answer("red", (game.questions.red.correctIndex + 1) % 3, 0);
    assert.equal(game.position, 0);
    assert.equal(game.points.red, 0);
    assert.equal(
        game.answer(
            "red",
            game.questions.red.correctIndex,
            MISTAKE_REVIEW_MS - 1,
        ),
        null,
    );
    assert.equal(
        game.answer("blue", game.questions.blue.correctIndex, 0).correct,
        true,
    );
    assert.equal(
        game.answer("red", game.questions.red.correctIndex, MISTAKE_REVIEW_MS)
            .correct,
        true,
    );
    assert.equal(game.position, 0);
});

test("rapid correct answers cannot bypass the cooldown", () => {
    const game = new RumbleGame();
    game.start(0);
    game.answer("red", game.questions.red.correctIndex, 0);
    assert.equal(
        game.answer("red", game.questions.red.correctIndex, 279),
        null,
    );
    assert.equal(
        game.answer("red", game.questions.red.correctIndex, 280).correct,
        true,
    );
    assert.equal(game.points.red, 2);
});

test("six net pulls win a round and a majority ends a best-of match early", () => {
    const game = new RumbleGame({ rounds: 3 });
    winRound(game, "blue");
    assert.equal(game.phase, "round-over");
    assert.equal(game.roundWinner, "blue");
    assert.equal(game.nextRound(), true);
    assert.equal(game.points.blue, 0);
    assert.equal(game.round, 2);
    winRound(game, "blue", 3000);
    assert.equal(game.phase, "match-over");
    assert.equal(game.winner, "blue");
    assert.equal(game.wins.blue, 2);
    assert.equal(game.totalPoints.blue, 12);
    assert.equal(game.nextRound(), false);
});

test("an elapsed round awards the lead and centered rope results in a draw", () => {
    const game = new RumbleGame({ rounds: 3, minutes: 1 });
    game.start(0);
    game.answer("red", game.questions.red.correctIndex, 0);
    game.tick(60000);
    assert.equal(game.roundWinner, "red");
    assert.equal(game.remainingMs, 0);
    game.nextRound();
    game.start(61000);
    game.tick(121000);
    assert.equal(game.roundWinner, null);
    assert.deepEqual(game.wins, { red: 1, blue: 0 });
});

test("answers at the deadline do not count toward a finished round", () => {
    const game = new RumbleGame({ rounds: 1, minutes: 1 });
    game.start(0);
    assert.equal(
        game.answer("red", game.questions.red.correctIndex, 60000),
        null,
    );
    assert.equal(game.phase, "match-over");
    assert.equal(game.winner, null);
    assert.equal(game.points.red, 0);
});

test("pause freezes both remaining time and the answer cooldown", () => {
    const game = new RumbleGame({ minutes: 1 });
    game.start(1000);
    game.answer("red", (game.questions.red.correctIndex + 1) % 3, 1000);
    game.pause(1100);
    game.tick(100000);
    assert.equal(game.remainingMs, 59900);
    game.resume(100000);
    assert.equal(
        game.answer(
            "red",
            game.questions.red.correctIndex,
            99900 + MISTAKE_REVIEW_MS - 1,
        ),
        null,
    );
    assert.equal(
        game.answer(
            "red",
            game.questions.red.correctIndex,
            99900 + MISTAKE_REVIEW_MS,
        ).correct,
        true,
    );
    game.tick(159900);
    assert.equal(game.phase, "round-over");
});

test("even-length matches and all-draw matches can end tied", () => {
    const game = new RumbleGame({ rounds: 2 });
    winRound(game, "red");
    game.nextRound();
    winRound(game, "blue", 3000);
    assert.equal(game.phase, "match-over");
    assert.equal(game.winner, null);
    game.reset({ rounds: 1, minutes: 1 });
    game.start(0);
    game.tick(60000);
    assert.equal(game.winner, null);
    assert.deepEqual(game.wins, { red: 0, blue: 0 });
});

test("reset clears scores, round history, clock, and cooldowns", () => {
    const game = new RumbleGame();
    winRound(game, "red");
    game.reset({ minutes: 2, rounds: 5 });
    assert.equal(game.phase, "ready");
    assert.equal(game.round, 1);
    assert.equal(game.remainingMs, 120000);
    assert.deepEqual(game.wins, { red: 0, blue: 0 });
    assert.deepEqual(game.totalPoints, { red: 0, blue: 0 });
    assert.deepEqual(game.roundResults, []);
});

test("restarting a paused match keeps its challenge and clears both teams' progress", () => {
    const settings = {
        operation: "mixed",
        difficulty: "hard",
        minutes: 2,
        rounds: 5,
    };
    const game = new RumbleGame(settings);
    winRound(game, "red");
    game.nextRound();
    game.start(3000);
    game.answer("blue", (game.questions.blue.correctIndex + 1) % 3, 3050);
    game.answer("red", game.questions.red.correctIndex, 3060);
    game.pause(3100);

    game.reset();

    assert.deepEqual(game.settings, settings);
    assert.equal(game.phase, "ready");
    assert.equal(game.round, 1);
    assert.equal(game.position, 0);
    assert.equal(game.remainingMs, 120000);
    assert.deepEqual(game.wins, { red: 0, blue: 0 });
    assert.deepEqual(game.points, { red: 0, blue: 0 });
    assert.deepEqual(game.streaks, { red: 0, blue: 0 });
    assert.deepEqual(game.cooldownUntil, { red: 0, blue: 0 });
    assert.deepEqual(game.roundResults, []);
    for (const team of ["red", "blue"]) {
        assert.deepEqual(game.getStats("match")[team], {
            correct: 0,
            attempts: 0,
            accuracy: null,
            roundsWon: 0,
        });
    }
    game.start(10000);
    assert.equal(
        game.answer("blue", game.questions.blue.correctIndex, 10001).correct,
        true,
    );
});
