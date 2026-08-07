import Controls from "../../baseSetup.js";
import {checkAuthStatus} from "../users/authHelper.js";

const { tasks = [], answers = [] } = window.APP || {};

export const ReviewControls = {
    setup: () => {
        ReviewControls.setupTask();
        ReviewControls.setupSubmit();
    },
    setupTask: async () => {
        let auth = await checkAuthStatus();
        let author;
        if (auth.authenticated) author = auth.user.record.id;
        const answersForTask = answers.filter(
            (a) => a.value && a.value.trim() !== "" && a.author !== author,
        );
        if (!answersForTask.length || !tasks.length) {
            console.log("There are no suitable answers!");
            document.getElementById("work-area").innerHTML =
                "There are currently no answers to review!";
            return;
        }

        const randIndex = Math.floor(Math.random() * answersForTask.length);
        let chosenAnswer = answersForTask[randIndex];
        const task = tasks.find((t) => t.id === chosenAnswer.target_id);

        if (!task) {
            console.log("The task does not exist!");
            await ReviewControls.setupTask();
            return;
        }

        Controls.viewer.setMarkdown(task.description);
        Controls.review_viewer.setMarkdown(chosenAnswer.value);
        Controls.editor.reset();
        localStorage.setItem("currentTargetID", chosenAnswer.id);
    },
    setupSubmit: () => {
        let submitbtn = document.getElementById("submit");
        if (submitbtn) {
            submitbtn.addEventListener("click", async () => {
                let target = localStorage.getItem("currentTargetID");
                let grade = document.getElementById("review-grade").value;
                let auth = await checkAuthStatus();
                let author = auth.user.record.id;
                const res = await fetch(`/review/submit`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        author: author,
                        target_id: target,
                        grade: grade,
                        value: Controls.editor.getMarkdown(),
                    }),
                });
                await ReviewControls.setupTask();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await ReviewControls.setup();
})