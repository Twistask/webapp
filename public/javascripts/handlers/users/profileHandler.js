const { tasks = [], answers = [], comments = [] } = window.APP || {};

let loader = () => {
    let tasksDiv = document.getElementById("my-tasks");
    let answersDiv = document.getElementById("my-answers");
    let commentsDiv = document.getElementById("my-reviews");
    tasks.forEach((task) => {
        let taskHref = document.createElement("a");
        taskHref.id = "task-link";
        taskHref.href = `/tasks/${task.id}`;
        taskHref.innerText = task.title;
        tasksDiv.appendChild(taskHref);
    });
    answers.forEach((ans) => {
        const task = tasks.find((t) => t.id === ans.target_id);
        let ansHref = document.createElement("a");
        ansHref.id = "answer-link";
        ansHref.href = `/answers/${ans.id}`;
        ansHref.innerText = `${task.title} (${ans.created})`;
        answersDiv.appendChild(ansHref);
    });
    comments.forEach((comm) => {
        const answer = answers.find((t) => t.id === comm.target_id);
        const task = tasks.find((t) => t.id === answer.target_id);
        let commHref = document.createElement("a");
        commHref.id = "comment-link";
        commHref.href = `/answers/${comm.target_id}`;
        commHref.innerText = `${task.title} (${comm.created})`;
        commentsDiv.appendChild(commHref);
    });
};

loader();