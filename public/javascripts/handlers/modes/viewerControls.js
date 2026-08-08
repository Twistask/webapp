let viewer;

const { main = "", children = [] } = window.VIEWER || {};

const { user = {} } = window.APP || {};

export const ViewerControls = {
  setup: () => {
    ViewerControls.setupMainViewer();
    ViewerControls.setupMain();
    ViewerControls.setupChildren();
  },
  setupMain: () => {
    if (main.title) document.getElementById("task-title").innerText = main.title;
    if (main.description) viewer.setMarkdown(main.description);
    else viewer.setMarkdown(main.value);
  },
  setupMainViewer: () => {
    const Editor = toastui.Editor;
    viewer = Editor.factory({
      el: document.querySelector("#viewer"),
      viewer: true,
      height: "500px",
      initialValue: "# hello",
    });
  },
  setupChildren: () => {
    for (const ch of children) {
      let ch_el = document.createElement("div");
      ch_el.id = `ch_${ch.id}`;
      let ch_area = document.getElementById("ch-area");
      ch_area.appendChild(ch_el);
      const Editor = toastui.Editor;
      let ch_view = Editor.factory({
        el: ch_el,
        viewer: true,
        height: "500px",
        initialValue: "# hello",
      });
      ch_view.setMarkdown(ch.value)
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await ViewerControls.setup();
})
