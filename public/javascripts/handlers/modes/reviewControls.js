let editor;
let task_viewer;
let answer_viewer;

const { tasks = [] } = window.APP || {};

const { answer = {} } = window.REVIEW || {};

export const ReviewControls = {
    setup: () => {
        ReviewControls.setupViewer();
        ReviewControls.setupTask();
        ReviewControls.setupSubmit();
    },
    setupViewer: () => {
        const Editor = toastui.Editor;
        editor = new Editor({
            el: document.querySelector("#editor"),
            height: "500px",
            initialEditType: "wysiwyg",
            previewStyle: "vertical",
        });
        task_viewer = Editor.factory({
            el: document.querySelector("#viewer"),
            viewer: true,
            height: "500px",
            initialValue: "# hello",
        });
        answer_viewer = Editor.factory({
            el: document.querySelector("#answer-viewer"),
            viewer: true,
            height: "500px",
            initialValue: "# hello",
        });
    },
    setupTask: async () => {
        // The task this answer targets may have been deleted since the
        // answer was submitted (an orphaned answer) - guard against that
        // instead of throwing on task.description.
        const task = tasks.find((t) => t.id === answer.target_id);
        const titleEl = document.getElementById("task-title");
        if (titleEl) titleEl.textContent = task ? task.title : "";
        task_viewer.setMarkdown(task ? task.description || "" : "This task is no longer available.");
        answer_viewer.setMarkdown(answer.value || "");
        editor.reset();
    },
    setupSubmit: () => {
        let submitbtn = document.getElementById("submit");
        if (submitbtn) {
            submitbtn.addEventListener("click", async () => {
                // answer.id comes from the server-rendered page, not
                // localStorage - see the matching note in
                // challengeControls.js for why that indirection was unsafe.
                if (!answer.id) return;

                const value = editor.getMarkdown();
                if (!value.trim()) {
                    alert("Please write a review before submitting.");
                    return;
                }

                submitbtn.disabled = true;
                try {
                    const res = await fetch(`/review/${answer.id}`, {
                        method: "POST",
                        credentials: "include",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({ value }),
                    });

                    if (!res.ok) {
                        console.error("Submit failed", res.status);
                        alert("Failed to submit your review. Please try again.");
                        return;
                    }

                    alert("Your review has been submitted!");
                    window.location.assign(`/users/profile`);
                } catch (err) {
                    console.error("Submit error", err);
                    alert("Network error while submitting your review.");
                } finally {
                    submitbtn.disabled = false;
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await ReviewControls.setup();
    } catch (err) {
        console.error("Failed to set up review mode:", err);
        const workArea = document.getElementById("work-area");
        if (workArea) workArea.innerText = "Something went wrong loading this page. Please refresh and try again.";
    }
})
