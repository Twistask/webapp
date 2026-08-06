import Controls from "./baseSetup.js";

const { task = "" } = window.APP || {};

let setupTask = () => {
  if (task.title) document.getElementById("task-title").innerText = task.title;
  if (task.description) Controls.viewer.setMarkdown(task.description);
  else Controls.viewer.setMarkdown(task.value);
};

setupTask();
