import Controls from "../../baseSetup.js";
import {checkAuthStatus} from "../users/authHelper.js";

const { tasks = [] } = window.APP || {};

export const EditorControls = {
    setup: () => {
        EditorControls.createChallengeItems(tasks);
        document.getElementById("challenge-select").onchange = EditorControls.setupTask;
        EditorControls.setupTask();
        EditorControls.setupSubmit();
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
            Controls.editor.setMarkdown(task.description);
        } else {
            document.getElementById("delete").style.display = "none";
            document.getElementById("task-title").value = "";
            Controls.editor.reset();
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
                let auth = await checkAuthStatus();
                let author = auth.user.record.id;
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
                                description: Controls.editor.getMarkdown(),
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
                            description: Controls.editor.getMarkdown(),
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
