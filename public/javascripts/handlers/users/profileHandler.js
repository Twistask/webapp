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
        taskHref.id = "task-link";
        taskHref.href = `/tasks/${task.id}`;
        taskHref.innerText = task.title;
        tasksDiv.appendChild(taskHref);
    }
    for (const ans of createdAns) {
        const task = tasks.find((t) => t.id === ans.target_id);
        let ansHref = document.createElement("a");
        ansHref.id = "answer-link";
        ansHref.href = `/answers/${ans.id}`;
        ansHref.innerText = `${task.title} (${ans.created})`;
        answersDiv.appendChild(ansHref);
    }
    for (const comm of createdComms) {
        const answer = answers.find((a) => a.id === comm.target_id);
        const task = tasks.find((t) => t.id === answer.target_id);
        let commHref = document.createElement("a");
        commHref.id = "comment-link";
        commHref.href = `/answers/${comm.target_id}`;
        commHref.innerText = `${task.title} (${comm.created})`;
        commentsDiv.appendChild(commHref);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await loader();
})