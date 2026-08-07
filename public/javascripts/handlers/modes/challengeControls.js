import Controls from "../../baseSetup.js";
import {checkAuthStatus} from "../users/authHelper.js";

const { tasks = [] } = window.APP || {};

export const ChallengeControls = {
    setup: () => {
        ChallengeControls.createChallengeItems(tasks);
        document.getElementById("challenge-select").onchange = ChallengeControls.setupTask;
        ChallengeControls.setupTask();
        ChallengeControls.setupSubmit();
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
        const task = tasks.find((t) => t.id === value);
        Controls.viewer.setMarkdown(task.description);
        Controls.editor.reset();
        localStorage.setItem("currentTargetID", task.id);
    },
    setupSubmit: async () => {
        let submitbtn = document.getElementById("submit");
        submitbtn.addEventListener("click", async () => {
            let target = localStorage.getItem("currentTargetID");
            let author;
            if (document.getElementById("author-name") !== null) {
                author = document.getElementById("author-name").value;
            } else {
                let auth = await checkAuthStatus();
                author = auth.user.record.id;
            }
            const res = await fetch(`/challenge/submit`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    author: author,
                    target_id: target,
                    value: Controls.editor.getMarkdown(),
                }),
            });
            const select = document.getElementById("challenge-select");
            const current = select.selectedIndex;
            const lastIndex = select.options.length - 1;

            if (current < lastIndex) {
                select.selectedIndex = current + 1;
            } else {
                select.selectedIndex = 0;
            }
            ChallengeControls.setupTask();
        })
    },
}

document.addEventListener('DOMContentLoaded', async () => {
    await ChallengeControls.setup();
})
