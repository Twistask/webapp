let viewer;

const { main = {}, children = [] } = window.VIEWER || {};

export const ViewerControls = {
  setup: () => {
    ViewerControls.setupMainViewer();
    ViewerControls.setupMain();
    ViewerControls.setupChildren();
  },
  setupMain: () => {
    if (main.title) document.getElementById("task-title").innerText = main.title;
    viewer.setMarkdown(main.description || main.value || "");
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
    let ch_area = document.getElementById("ch-area");
    if (children.length === 0) {
      ch_area.innerText = "There's currently nothing to display here!";
    } else {
      for (const ch of children) {
        let ch_el = document.createElement("div");
        ch_el.id = `ch_${ch.id}`;
        ch_area.appendChild(ch_el);
        const Editor = toastui.Editor;
        let ch_view = Editor.factory({
          el: ch_el,
          viewer: true,
          height: "500px",
          initialValue: "# hello",
        });
        ch_view.setMarkdown(ch.value || "")
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await ViewerControls.setup();
  } catch (err) {
    console.error("Failed to set up viewer:", err);
    const workArea = document.getElementById("work-area");
    if (workArea) workArea.innerText = "Something went wrong loading this page. Please refresh and try again.";
  }
})
