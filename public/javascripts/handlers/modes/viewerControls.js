let viewer;

const { main = {}, children = [], childType = null } = window.VIEWER || {};
const { user = {} } = window.APP || {};

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

        // Only a task's *answers* are reviewable - /review/:id expects an
        // answer id, so the same link on an answer's *comments* (when
        // childType is "comment") would always 404. Also skip your own
        // answer: the server rejects a self-review anyway, no reason to
        // dangle a link that will just be turned away. Nested inside the
        // card (not a sibling in ch_area) so it doesn't break the
        // `#ch-area > div + div` spacing rule between cards.
        if (childType === "answer" && ch.author !== user.id) {
          let review_link = document.createElement("a");
          review_link.id = `review_${ch.id}`;
          review_link.className = "review-link";
          review_link.href = `/review/${ch.id}`;
          review_link.textContent = "Review this answer";
          ch_el.appendChild(review_link);
        }
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
