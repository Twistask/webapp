const { tasks = [], answers = [], comments = [], user = {} } = window.APP || {};

let loader = async () => {
    let tasksDiv = document.getElementById("my-tasks");
    let answersDiv = document.getElementById("my-answers");
    let commentsDiv = document.getElementById("my-reviews");
    const createdTasks = tasks.filter((t) => t.author === user.id);
    const createdAns = answers.filter((t) => t.author === user.id);
    const createdComms = comments.filter((t) => t.author === user.id);
    for (const task of createdTasks) {
        let taskHref = document.createElement("a");
        // class, not id: these are generated in a loop, and a repeated id
        // is invalid HTML and breaks getElementById-based lookups.
        taskHref.className = "task-link";
        taskHref.href = `/tasks/${task.id}`;
        taskHref.innerText = task.title;
        tasksDiv.appendChild(taskHref);
    }
    for (const ans of createdAns) {
        const task = tasks.find((t) => t.id === ans.target_id);
        if (!task) continue; // orphaned answer (its task was deleted)
        let ansHref = document.createElement("a");
        ansHref.className = "answer-link";
        ansHref.href = `/answers/${ans.id}`;
        ansHref.innerText = `${task.title} (${ans.created})`;
        answersDiv.appendChild(ansHref);
    }
    for (const comm of createdComms) {
        const answer = answers.find((a) => a.id === comm.target_id);
        if (!answer) continue; // orphaned comment (its answer was deleted)
        const task = tasks.find((t) => t.id === answer.target_id);
        if (!task) continue; // orphaned answer (its task was deleted)
        let commHref = document.createElement("a");
        commHref.className = "comment-link";
        commHref.href = `/answers/${comm.target_id}`;
        commHref.innerText = `${task.title} (${comm.created})`;
        commentsDiv.appendChild(commHref);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loader();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
})
