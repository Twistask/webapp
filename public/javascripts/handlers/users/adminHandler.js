export const AdminTasksDirectory = {
    setup: () => {
        AdminTasksDirectory.render();
    },
    render: () => {
        const { tasks = [] } = window.APP || {};
        const taskList = document.getElementById("task-list");
        if (!taskList) return;

        // Clear out whatever was rendered for the previous language
        // before rebuilding - this runs again on "app:languagechange",
        // not just once at page load.
        taskList.innerHTML = "";

        const grid = document.createElement("div");
        grid.className = "task-grid";
        for (const task of tasks) {
            grid.appendChild(AdminTasksDirectory.buildCard(task));
        }
        taskList.appendChild(grid);
    },
    buildCard: (task) => {
        const card = document.createElement("a");
        card.className = "task-card";
        card.id = `tasks_${task.id}`;
        card.href = `/tasks/${task.id}`;

        const title = document.createElement("span");
        title.className = "task-card-title";
        // textContent, not innerHTML: task titles are user-authored
        // content and must never be parsed as markup.
        title.textContent = task.title;

        const cta = document.createElement("span");
        cta.className = "task-card-cta";
        cta.textContent = "View this task";

        card.append(title, cta);
        return card;
    },
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        AdminTasksDirectory.setup();
    } catch (err) {
        console.error("Failed to load tasks directory:", err);
        const taskList = document.getElementById("task-list");
        if (taskList) taskList.textContent = "Something went wrong loading this page. Please refresh and try again.";
    }
});
