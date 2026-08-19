import { convertToString } from "../../utils/timeConverter.js";
import { t } from "../../utils/i18n.js";

const DIFFICULTY_LABELS = {
    easy: () => t('common.difficulty.easy'),
    medium: () => t('common.difficulty.medium'),
    hard: () => t('common.difficulty.hard'),
    superHard: () => t('common.difficulty.superHard'),
};

const STATUS_COPY = {
    completed: () => t('trial.result.completed'),
    timeout: () => t('trial.result.timeout'),
    gaveUp: () => t('trial.result.gaveUp'),
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
    cta.textContent = t('common.viewThisTask');

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
        solvedEl.textContent = t('trial.result.startPrompt');
        return;
    }

    let summary;
    try {
        summary = JSON.parse(raw);
    } catch (err) {
        console.error("Failed to parse trial result summary:", err);
        solvedEl.textContent = t('trial.result.startPrompt');
        return;
    }

    const getCopy = STATUS_COPY[summary.status] || STATUS_COPY.completed;
    headingEl.textContent = getCopy();

    const solvedTasks = Array.isArray(summary.solvedTasks) ? summary.solvedTasks : [];
    const getDifficultyLabel = DIFFICULTY_LABELS[summary.difficulty];
    const difficultyLabel = getDifficultyLabel ? getDifficultyLabel() : summary.difficulty || t('common.difficulty.unknown');

    statsEl.append(
        buildStat(t('trial.result.difficultyLabel'), difficultyLabel),
        buildStat(t('trial.result.solvedLabel'), `${solvedTasks.length} / ${summary.tasksAmount}`),
        buildStat(t('trial.result.timeTakenLabel'), convertToString(summary.timeTakenMs || 0)),
    );

    if (solvedTasks.length === 0) {
        solvedEl.textContent = t('trial.result.noneSolved');
        return;
    }

    const heading = document.createElement("h2");
    heading.textContent = t('trial.result.tasksSolved');
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
