import { checkAuthStatus } from "./handlers/users/authHelper.js";

let editor = undefined;
let viewer = undefined;
let review_viewer = undefined;
let mode = localStorage.getItem("mode");

let setupPage = async () => {
  const access_els = Array.from(document.querySelectorAll("[data-access]"));

  let auth = await checkAuthStatus();
  console.log(auth);
  switch (auth.authenticated) {
    case true:
      access_els.forEach((el) => {
        const modes = el.dataset.access.split(/\s+/);
        if (!modes.includes("authOnly")) el.remove();
      });
      break;
    case false:
      access_els.forEach((el) => {
        const modes = el.dataset.access.split(/\s+/);
        if (!modes.includes("guestOnly")) el.remove();
      });
      break;
  }
  const mode_els = Array.from(document.querySelectorAll("[data-modes]"));
  mode_els.forEach((el) => {
    const modes = el.dataset.modes.split(/\s+/);
    if (!modes.includes(mode)) el.remove();
  });
  switch (mode) {
    default:
    case "home":
    case "challenge":
    case "review":
      document.getElementById("trial-menu").remove();
      break;
    case "timeTrial":
      document.getElementById("common").remove();
      access_els.forEach((el) => {
        el.remove();
      });
      break;
  }
};

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

await setupPage();
setupEditor();
setupLogout();

export default {
  editor,
  viewer,
  review_viewer,
};
