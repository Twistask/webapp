const { tasks = [], user = {} } = window.APP || {};

let editor;

export const EditorControls = {
    setup: () => {
        EditorControls.createChallengeItems(tasks);
        document.getElementById("challenge-select").onchange = EditorControls.setupTask;
        EditorControls.setupEditor();
        EditorControls.preselectFromQuery();
        EditorControls.setupTask();
        EditorControls.setupImporter();
        EditorControls.setupSubmit();
        EditorControls.setupDelete();
    },
    // The admin panel links here as /editor?task=<id> so "Edit" jumps
    // straight to a specific task instead of leaving the admin to find
    // it again in the dropdown themselves.
    preselectFromQuery: () => {
        const taskId = new URLSearchParams(window.location.search).get("task");
        if (!taskId) return;
        const select = document.getElementById("challenge-select");
        if (tasks.some((t) => t.id === taskId)) select.value = taskId;
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
    // The Delete button was only ever shown/hidden (setupTask, above) -
    // nothing ever attached a click handler to it, so it was inert.
    setupDelete: () => {
        const deleteBtn = document.getElementById("delete");
        if (!deleteBtn) return;
        deleteBtn.addEventListener("click", async () => {
            const value = document.getElementById("challenge-select").value;
            if (value === "new") return;

            const confirmed = confirm(
                "Delete this task? All of its submitted answers and reviews will be permanently deleted too. This cannot be undone.",
            );
            if (!confirmed) return;

            deleteBtn.disabled = true;
            try {
                const res = await fetch("/editor/delete", {
                    method: "DELETE",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: value }),
                });

                if (!res.ok) {
                    console.error("Delete failed", res.status);
                    alert("Failed to delete the task. Please try again.");
                    return;
                }

                window.location.reload();
            } catch (err) {
                console.error("Delete error", err);
                alert("Network error while deleting the task.");
            } finally {
                deleteBtn.disabled = false;
            }
        });
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
