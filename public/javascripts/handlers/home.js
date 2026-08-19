import { t } from "../utils/i18n.js";

const FEATURED_COUNT = 3;

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
    cta.textContent = t('home.solveThisTask');

    card.append(title, cta);
    return card;
};

const render = () => {
    const { tasks = [] } = window.APP || {};
    const availableTasks = tasks.filter((task) => task.language === sessionStorage.getItem("language"));

    const statsEl = document.getElementById("home-stats");
    const featuredEl = document.getElementById("featured-tasks");
    if (!statsEl || !featuredEl) return;

    // Clear out whatever was rendered for the previous language before
    // rebuilding - this runs again on "app:languagechange", not just
    // once at page load.
    statsEl.textContent = "";
    featuredEl.innerHTML = "";

    if (availableTasks.length === 0) {
        statsEl.textContent = t('home.noTasks');
        return;
    }

    statsEl.textContent =
        availableTasks.length === 1
            ? t('home.tasksReady.one')
            : t('home.tasksReady.other', { count: availableTasks.length });

    // A light shuffle so the homepage highlights a different sample of
    // tasks on each visit instead of always the same first few.
    const featured = [...availableTasks].sort(() => Math.random() - 0.5).slice(0, FEATURED_COUNT);

    const grid = document.createElement("div");
    grid.className = "task-grid";
    for (const task of featured) {
        grid.appendChild(buildTaskCard(task));
    }
    featuredEl.appendChild(grid);

    if (availableTasks.length > FEATURED_COUNT) {
        const browseAll = document.createElement("a");
        browseAll.id = "browse-all-tasks";
        browseAll.href = "/tasks";
        browseAll.textContent = t('home.browseAllTasks', { count: availableTasks.length });
        featuredEl.appendChild(browseAll);
    }
};

const setup = () => {
    render();
    window.addEventListener("app:languagechange", render);
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        setup();
    } catch (err) {
        console.error("Failed to load homepage tasks:", err);
        const statsEl = document.getElementById("home-stats");
        if (statsEl) statsEl.textContent = "";
    }
});
