import { checkAuthStatus } from "./handlers/users/authHelper.js";
import Controls from "./baseSetup.js";

const { tasks = [] } = window.APP || {};

let setupEditor = () => {
  createChallengeItems(tasks);
  document.getElementById("challenge-select").onchange = setupTask;
  setupTask();
}

function createChallengeItems(items) {
  let select = document.getElementById("challenge-select");
  items.forEach((item) => {
    let opt = document.createElement("option");
    opt.value = item.id;
    opt.innerHTML = item.title;
    select.appendChild(opt);
  });
}

let setupTask = () => {
  const value = document.getElementById("challenge-select").value;
  if (value !== "new") {
    const task = tasks.find((t) => t.id === value);
    document.getElementById("delete").style.display = "flex";
    document.getElementById("task-title").value = task.title;
    Controls.editor.setMarkdown(task.description);
  } else {
    document.getElementById("delete").style.display = "none";
    document.getElementById("task-title").value = "";
    Controls.editor.reset();
  }
}

let setupSubmit = () => {
  let submitbtn = document.getElementById("submit");
  if (submitbtn) {
    submitbtn.addEventListener("click", async () => {
      let sound = new Audio();
      sound.src = "../sounds/emblem.wav";
      document.body.appendChild(sound);
      sound.volume = 0.5;
      await sound.play();
      let auth = await checkAuthStatus();
      let author = auth.user.record.id;
      const value = document.getElementById("challenge-select").value;
      if (value !== "new") {
        const res = await fetch(`/editor/update`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: value,
            task: {
              author: author,
              title: document.getElementById("task-title").value,
              description: Controls.editor.getMarkdown(),
            }
          }),
        });
      } else {
        const res = await fetch(`/editor/submit`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            author: author,
            title: document.getElementById("task-title").value,
            description: Controls.editor.getMarkdown(),
          }),
        });
      }

    });
  }
};

let setupDelete = () => {
  document
      .getElementById("delete")
      .addEventListener("click", async () => {
        let answer = confirm(
            "THIS ACTION IS IRREVERSIBLE!!! The task will be permanently deleted! Are you sure?",
        );
        if (answer === true) {
          await fetch("/editor/delete", {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: document.getElementById("challenge-select").value
            })
          });
        }
      });
}

setupEditor();
setupSubmit();
setupDelete();
