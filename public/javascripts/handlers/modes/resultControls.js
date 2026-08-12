import { convertToString } from "../../utils/timeConverter.js";

const DIFFICULTY_LABELS = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    superHard: "Super Hard",
};

const STATUS_COPY = {
    completed: { emoji: "🎉", heading: "Trial Completed!" },
    timeout: { emoji: "⏰", heading: "Time's Up!" },
    gaveUp: { emoji: "🏳️", heading: "Trial Ended" },
};

const buildStat = (label, value) => {
    const wrap = document.createElement("div");
    wrap.className = "result-stat";

    const v = document.createElement("span");
    v.className = "result-stat-value";
    v.textContent = value;

    const l = document.createElement("span");
    l.className = "result-stat-label";
    l.textContent = label;

    wrap.append(v, l);
    return wrap;
};

const buildTaskCard = (task) => {
    const card = document.createElement("a");
    card.className = "task-card";
    card.href = `/challenge/${task.id}`;

    const title = document.createElement("span");
    title.className = "task-card-title";
    // textContent, not innerHTML: task titles are user-authored content
    // and must never be parsed as markup.
    title.textContent = task.title;

    const cta = document.createElement("span");
    cta.className = "task-card-cta";
    cta.textContent = "View this task →";

    card.append(title, cta);
    return card;
};

const setup = () => {
    const headingEl = document.getElementById("result-heading");
    const statsEl = document.getElementById("result-stats");
    const solvedEl = document.getElementById("result-solved");

    // Read once, then clear: a direct visit or a page refresh after the
    // summary has already been consumed should fall back to a plain
    // message instead of showing stale (or empty) data.
    const raw = sessionStorage.getItem("trialResult");
    sessionStorage.removeItem("trialResult");
    if (!raw) {
        solvedEl.textContent = "Start a time trial to see your results here.";
        return;
    }

    let summary;
    try {
        summary = JSON.parse(raw);
    } catch (err) {
        console.error("Failed to parse trial result summary:", err);
        solvedEl.textContent = "Start a time trial to see your results here.";
        return;
    }

    const copy = STATUS_COPY[summary.status] || STATUS_COPY.completed;
    headingEl.textContent = `${copy.emoji} ${copy.heading}`;

    const solvedTasks = Array.isArray(summary.solvedTasks) ? summary.solvedTasks : [];
    const difficultyLabel = DIFFICULTY_LABELS[summary.difficulty] || summary.difficulty || "Unknown";

    statsEl.append(
        buildStat("Difficulty", difficultyLabel),
        buildStat("Solved", `${solvedTasks.length} / ${summary.tasksAmount}`),
        buildStat("Time Taken", convertToString(summary.timeTakenMs || 0)),
    );

    if (solvedTasks.length === 0) {
        solvedEl.textContent = "You didn't submit any answers this time - give it another shot!";
        return;
    }

    const heading = document.createElement("h2");
    heading.textContent = "Tasks You Solved";
    const grid = document.createElement("div");
    grid.className = "task-grid";
    for (const task of solvedTasks) {
        grid.appendChild(buildTaskCard(task));
    }
    solvedEl.append(heading, grid);
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        setup();
    } catch (err) {
        console.error("Failed to render trial result:", err);
    }
});
