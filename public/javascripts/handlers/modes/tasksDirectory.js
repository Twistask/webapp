const { tasks = [], user = {} } = window.APP || {};

let work_area = document.getElementById("work-area");
let availableTasks = tasks.filter((t) => t.language === sessionStorage.getItem("language"));
availableTasks.forEach((task) => {
    let task_link = document.createElement("a");
    task_link.id = `challenge_${task.id}`;
    task_link.href = `/challenge/${task.id}`;
    task_link.textContent = `Solve ${task.title}!`;
    work_area.appendChild(task_link);
})