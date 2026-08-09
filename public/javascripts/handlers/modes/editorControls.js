const { tasks = [], user = {} } = window.APP || {};

console.log(window.APP);

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
            };
            reader.readAsText(file);

        })
    },
    createChallengeItems: () => {
        let select = document.getElementById("challenge-select");
        tasks.forEach((item) => {
            let opt = document.createElement("option");
            opt.value = item.id;
            opt.innerHTML = item.title;
            select.appendChild(opt);
        });
    },
    setupTask: () => {
        const value = document.getElementById("challenge-select").value;
        if (value !== "new") {
            const task = tasks.find((t) => t.id === value);
            document.getElementById("delete").style.display = "flex";
            document.getElementById("task-title").value = task.title;
            editor.setMarkdown(task.description);
        } else {
            document.getElementById("delete").style.display = "none";
            document.getElementById("task-title").value = "";
            editor.reset();
        }
    },
    setupSubmit: async () => {
        let submitbtn = document.getElementById("submit");
        if (submitbtn) {
            submitbtn.addEventListener("click", async () => {
                let sound = new Audio();
                sound.src = "../sounds/emblem.wav";
                document.body.appendChild(sound);
                sound.volume = 0.5;
                await sound.play();
                let author = user.id;
                let title = document.getElementById("task-title").value;
                const value = document.getElementById("challenge-select").value;
                if (value !== "new") {
                    const res = await fetch(`/editor/update`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            id: value,
                            task: {
                                author: author,
                                title: title,
                                description: editor.getMarkdown(),
                            },
                        }),
                    });
                } else {
                    const res = await fetch(`/editor/submit`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            author: author,
                            title: title,
                            description: editor.getMarkdown(),
                        }),
                    });
                }
                window.location.reload();
            });
        }
    },
}

document.addEventListener('DOMContentLoaded', async () => {
    await EditorControls.setup();
})
