let viewer;

const { task = "", answers = [] } = window.APP || {};

export const ViewerControls = {
  setup: () => {
    ViewerControls.setupTaskViewer();
    ViewerControls.setupTask();
    ViewerControls.setupAnswers();
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
  },
  setupAnswers: () => {
    for (const ans of answers) {
      let ans_el = document.createElement("div");
      ans_el.id = `ans_${ans.id}`;
      let ans_area = document.getElementById("answer-area");
      ans_area.appendChild(ans_el);
      const Editor = toastui.Editor;
      let ans_view = Editor.factory({
        el: ans_el,
        viewer: true,
        height: "500px",
        initialValue: "# hello",
      });
      ans_view.setMarkdown(ans.value)
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await ViewerControls.setup();
})
