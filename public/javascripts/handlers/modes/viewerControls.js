let viewer;

const { task = "" } = window.APP || {};

export const ViewerControls = {
  setup: () => {
    ViewerControls.setupTaskViewer();
    ViewerControls.setupTask();
  },
  setupTask: () => {
    if (task.title) document.getElementById("task-title").innerText = task.title;
    if (task.description) viewer.setMarkdown(task.description);
    else viewer.setMarkdown(task.value);
  },
  setupTaskViewer: () => {
    const Editor = toastui.Editor;
    viewer = Editor.factory({
      el: document.querySelector("#viewer"),
      viewer: true,
      height: "500px",
      initialValue: "# hello",
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await ViewerControls.setup();
})
