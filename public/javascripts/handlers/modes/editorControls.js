const { tasks = [], user = {} } = window.APP || {};

let editor;

export const EditorControls = {
    setup: () => {
        EditorControls.createChallengeItems(tasks);
        document.getElementById("challenge-select").onchange = EditorControls.setupTask;
        EditorControls.setupEditor();
        EditorControls.setupTask();
        EditorControls.setupImporter();
        EditorControls.setupSubmit();
    },
    setupEditor: () => {
        const Editor = toastui.Editor;
        editor = new Editor({
            el: document.querySelector("#editor"),
            height: "500px",
            initialEditType: "wysiwyg",
            previewStyle: "vertical",
        });
    },
    setupImporter: () => {
        document.getElementById("markdown-import").addEventListener('change', (ev) => {
            const file = ev.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                editor.setMarkdown(e.target.result);
                document.getElementById("markdown-import").value = null;
            };
            reader.onerror = (e) => {
                console.error('Error reading file:', e.target.error);
                alert("Could not read that file.");
            };
            reader.readAsText(file);

        })
    },
    createChallengeItems: () => {
        let select = document.getElementById("challenge-select");
        tasks.forEach((item) => {
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
        if (value !== "new") {
            const task = tasks.find((t) => t.id === value);
            if (!task) {
                document.getElementById("delete").style.display = "none";
                document.getElementById("task-title").value = "";
                document.getElementById("task-language").value = "en";
                editor.reset();
                return;
            }
            document.getElementById("delete").style.display = "flex";
            document.getElementById("task-title").value = task.title;
            document.getElementById("task-language").value = task.language;
            editor.setMarkdown(task.description || "");
        } else {
            document.getElementById("delete").style.display = "none";
            document.getElementById("task-title").value = "";
            document.getElementById("task-language").value = "en";
            editor.reset();
        }
    },
    setupSubmit: async () => {
        let submitbtn = document.getElementById("submit");
        if (submitbtn) {
            submitbtn.addEventListener("click", async () => {
                const title = document.getElementById("task-title").value.trim();
                if (!title) {
                    alert("Please enter a task title.");
                    return;
                }

                const author = user.id;
                const value = document.getElementById("challenge-select").value;
                const language = document.getElementById("task-language").value;

                submitbtn.disabled = true;
                try {
                    let res;
                    if (value !== "new") {
                        res = await fetch(`/editor/update`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                id: value,
                                task: {
                                    author: author,
                                    title: title,
                                    description: editor.getMarkdown(),
                                    language: language
                                },
                            }),
                        });
                    } else {
                        res = await fetch(`/editor/submit`, {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                author: author,
                                title: title,
                                description: editor.getMarkdown(),
                                language: language
                            }),
                        });
                    }

                    if (!res.ok) {
                        console.error("Save failed", res.status);
                        alert("Failed to save the task. Your changes were not saved - please try again.");
                        return;
                    }

                    window.location.reload();
                } catch (err) {
                    console.error("Save error", err);
                    alert("Network error while saving. Your changes were not saved.");
                } finally {
                    submitbtn.disabled = false;
                }
            });
        }
    },
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await EditorControls.setup();
    } catch (err) {
        console.error("Failed to set up editor:", err);
        const workArea = document.getElementById("work-area");
        if (workArea) workArea.innerText = "Something went wrong loading this page. Please refresh and try again.";
    }
})
