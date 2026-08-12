export const TasksDirectory = {
    setup: () => {
        TasksDirectory.render();
        window.addEventListener("app:languagechange", TasksDirectory.render);
    },
    render: () => {
        const { tasks = [] } = window.APP || {};
        const taskList = document.getElementById("task-list");
        if (!taskList) return;

        // Clear out whatever was rendered for the previous language
        // before rebuilding - this runs again on "app:languagechange",
        // not just once at page load.
        taskList.innerHTML = "";

        const availableTasks = tasks.filter((t) => t.language === sessionStorage.getItem("language"));

        if (availableTasks.length === 0) {
            taskList.textContent = "There are currently no tasks available in this language.";
            return;
        }

        const grid = document.createElement("div");
        grid.className = "task-grid";
        for (const task of availableTasks) {
            grid.appendChild(TasksDirectory.buildCard(task));
        }
        taskList.appendChild(grid);
    },
    buildCard: (task) => {
        const card = document.createElement("a");
        card.className = "task-card";
        card.id = `challenge_${task.id}`;
        card.href = `/challenge/${task.id}`;

        const title = document.createElement("span");
        title.className = "task-card-title";
        // textContent, not innerHTML: task titles are user-authored
        // content and must never be parsed as markup.
        title.textContent = task.title;

        const cta = document.createElement("span");
        cta.className = "task-card-cta";
        cta.textContent = "Solve this task →";

        card.append(title, cta);
        return card;
    },
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        TasksDirectory.setup();
    } catch (err) {
        console.error("Failed to load tasks directory:", err);
        const taskList = document.getElementById("task-list");
        if (taskList) taskList.textContent = "Something went wrong loading this page. Please refresh and try again.";
    }
});
