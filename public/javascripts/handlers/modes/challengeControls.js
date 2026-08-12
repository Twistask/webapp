const { user = {} } = window.APP || {};

const { task = {} } = window.CHALLENGE || {};

let editor;
let viewer;

export const ChallengeControls = {
    setup: () => {
        ChallengeControls.setupEditor();
        ChallengeControls.setupTask();
        ChallengeControls.setupSubmit();
    },
    setupEditor: () => {
        const Editor = toastui.Editor;
        editor = new Editor({
            el: document.querySelector("#editor"),
            height: "500px",
            initialEditType: "wysiwyg",
            previewStyle: "vertical",
        });
        viewer = Editor.factory({
            el: document.querySelector("#viewer"),
            viewer: true,
            height: "500px",
            initialValue: "# hello",
        });
    },
    setupTask: () => {
        const titleEl = document.getElementById("task-title");
        if (titleEl) titleEl.textContent = task.title || "";
        viewer.setMarkdown(task.description || "");
        editor.reset();
    },
    setupSubmit: async () => {
        let submitbtn = document.getElementById("submit");
        submitbtn.addEventListener("click", async () => {
            // task.id comes straight from the server-rendered page, not
            // localStorage - localStorage is shared across every tab on
            // this origin, so solving a different task in another tab
            // would silently redirect this tab's submission to the wrong
            // task.
            if (!task.id) {
                alert("No challenge selected. Please pick one first.");
                return;
            }

            let author;
            const authorField = document.getElementById("author-name");
            if (authorField !== null) {
                author = authorField.value.trim();
            } else {
                author = user.id;
            }
            if (!author) {
                alert("Please enter your name before submitting.");
                return;
            }

            const value = editor.getMarkdown();
            if (!value.trim()) {
                alert("Please write an answer before submitting.");
                return;
            }

            submitbtn.disabled = true;
            try {
                const res = await fetch(`/challenge/${task.id}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ author, value }),
                });

                if (!res.ok) {
                    console.error("Submit failed", res.status);
                    alert("Failed to submit your answer. Please try again.");
                    return;
                }

                editor.reset();
                alert("Your answer has been submitted!");
            } catch (err) {
                console.error("Submit error", err);
                alert("Network error while submitting your answer.");
            } finally {
                submitbtn.disabled = false;
            }
        })
    },
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ChallengeControls.setup();
    } catch (err) {
        console.error("Failed to set up challenge mode:", err);
        const workArea = document.getElementById("work-area");
        if (workArea) workArea.innerText = "Something went wrong loading this page. Please refresh and try again.";
    }
})
