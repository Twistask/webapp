let editor;
let task_viewer;
let answer_viewer;

const { tasks = [], answers = [], user = {} } = window.APP || {};

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
        let author = user.id;
        // Only consider answers whose task still exists - filtering this up
        // front (rather than retrying with a fresh random pick on a miss)
        // avoids unbounded recursion when the pool contains nothing but
        // orphaned answers.
        const answersForTask = answers.filter(
            (a) =>
                a.value &&
                a.value.trim() !== "" &&
                a.author !== author &&
                tasks.some((t) => t.id === a.target_id),
        );
        if (!answersForTask.length || !tasks.length) {
            console.log("There are no suitable answers!");
            document.getElementById("work-area").innerHTML =
                "There are currently no answers to review!";
            return;
        }

        const randIndex = Math.floor(Math.random() * answersForTask.length);
        const chosenAnswer = answersForTask[randIndex];
        const task = tasks.find((t) => t.id === chosenAnswer.target_id);

        task_viewer.setMarkdown(task.description || "");
        answer_viewer.setMarkdown(chosenAnswer.value || "");
        editor.reset();
        localStorage.setItem("currentTargetID", chosenAnswer.id);
    },
    setupSubmit: () => {
        let submitbtn = document.getElementById("submit");
        if (submitbtn) {
            submitbtn.addEventListener("click", async () => {
                const target = localStorage.getItem("currentTargetID");
                if (!target) return;
                const author = user.id;

                submitbtn.disabled = true;
                try {
                    const res = await fetch(`/review/submit`, {
                        method: "POST",
                        credentials: "include",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            author: author,
                            target_id: target,
                            value: editor.getMarkdown(),
                        }),
                    });

                    if (!res.ok) {
                        console.error("Submit failed", res.status);
                        alert("Failed to submit your review. Please try again.");
                        return;
                    }

                    await ReviewControls.setupTask();
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
