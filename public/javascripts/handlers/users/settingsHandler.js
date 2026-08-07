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
    commHref.href = `/comments/${comm.id}`;
    commHref.innerText = `${task.title} (${comm.created})`;
    commentsDiv.appendChild(commHref);
  });
};

document
  .getElementById("delete_account")
  .addEventListener("click", async () => {
    let answer = confirm(
      "THIS ACTION IS IRREVERSIBLE!!! All your tasks, answers and reviews will be permanently deleted! Are you sure?",
    );
    if (answer === true) {
      await fetch("/users/delete", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/";
    }
  });

document.getElementById("submit_pw").addEventListener("click", async () => {
  await fetch("/users/changePW", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  window.location.href = "/";
});

loader();
