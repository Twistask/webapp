const { tasks = [], user = {} } = window.APP || {};

let editor;
let viewer;

export const ChallengeControls = {
    setup: () => {
        ChallengeControls.createChallengeItems(tasks);
        ChallengeControls.setupEditor();
        document.getElementById("challenge-select").onchange = ChallengeControls.setupTask;
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
    createChallengeItems: () => {
        let select = document.getElementById("challenge-select");
        let availableTasks = tasks.filter((t) => t.language === sessionStorage.getItem("language"));
        availableTasks.forEach((item) => {
            let opt = document.createElement("option");
            opt.value = item.id;
            // textContent, not innerHTML: task titles are user-authored
            // content and must never be parsed as markup.
            opt.textContent = item.title;
            select.appendChild(opt);
        });
    },
    setupTask: () => {
        const value = document.getElementById("challenge-select").value;
        const task = tasks.find((t) => t.id === value);
        const submitbtn = document.getElementById("submit");
        if (!task) {
            viewer.setMarkdown("There are currently no challenges available!");
            editor.reset();
            if (submitbtn) submitbtn.disabled = true;
            return;
        }
        if (submitbtn) submitbtn.disabled = false;
        viewer.setMarkdown(task.description || "");
        editor.reset();
        localStorage.setItem("currentTargetID", task.id);
    },
    setupSubmit: async () => {
        let submitbtn = document.getElementById("submit");
        submitbtn.addEventListener("click", async () => {
            const target = localStorage.getItem("currentTargetID");
            let author;
            const authorField = document.getElementById("author-name");
            if (authorField !== null) {
                author = authorField.value.trim();
            } else {
                author = user.id;
            }

            if (!target) {
                alert("No challenge selected. Please pick one first.");
                return;
            }
            if (!author) {
                alert("Please enter your name before submitting.");
                return;
            }

            submitbtn.disabled = true;
            try {
                const res = await fetch(`/challenge/submit`, {
                    method: "POST",
                    credentials: "include",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        author: author,
                        target_id: target,
                        value: editor.getMarkdown(),
                        language: sessionStorage.getItem("language")
                    }),
                });

                if (!res.ok) {
                    console.error("Submit failed", res.status);
                    alert("Failed to submit your answer. Please try again.");
                    return;
                }

                const select = document.getElementById("challenge-select");
                const current = select.selectedIndex;
                const lastIndex = select.options.length - 1;

                select.selectedIndex = current < lastIndex ? current + 1 : 0;
                ChallengeControls.setupTask();
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
