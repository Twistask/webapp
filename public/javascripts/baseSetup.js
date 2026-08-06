let editor = undefined;
let viewer = undefined;
let review_viewer = undefined;

let setupEditor = () => {
  let editor_el = document.getElementById("editor");
  if (editor_el) {
    const Editor = toastui.Editor;
    editor = new Editor({
      el: document.querySelector("#editor"),
      height: "500px",
      initialEditType: "wysiwyg",
      previewStyle: "vertical",
    });
  }
  let viewer_el = document.getElementById("viewer");
  if (viewer_el) {
    const Editor = toastui.Editor;
    viewer = Editor.factory({
      el: document.querySelector("#viewer"),
      viewer: true,
      height: "500px",
      initialValue: "# hello",
    });
  }
  let review_viewer_el = document.getElementById("answer-viewer");
  if (review_viewer_el) {
    const Editor = toastui.Editor;
    review_viewer = Editor.factory({
      el: document.querySelector("#answer-viewer"),
      viewer: true,
      height: "500px",
      initialValue: "# hello",
    });
  }
};

let setupLogout = () => {
  if (document.getElementById("logout"))
    document.getElementById("logout").addEventListener("click", async (ev) => {
      try {
        const res = await fetch("/users/logout", {
          method: "POST", // use POST to match your route
          credentials: "include", // send HttpOnly cookie
          headers: {
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          console.error("Logout failed", res.status);
          // show a simple message — replace with nicer UI as needed
          alert("Logout failed. Please try again.");
        }
        window.location.href = "/";
      } catch (err) {
        console.error("Logout error", err);
        alert("Network error while logging out.");
      }
    });
};

setupEditor();
setupLogout();

export default {
  editor,
  viewer,
  review_viewer,
};
