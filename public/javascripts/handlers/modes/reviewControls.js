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

        task_viewer.setMarkdown(task.description);
        answer_viewer.setMarkdown(chosenAnswer.value);
        editor.reset();
        localStorage.setItem("currentTargetID", chosenAnswer.id);
    },
    setupSubmit: () => {
        let submitbtn = document.getElementById("submit");
        if (submitbtn) {
            submitbtn.addEventListener("click", async () => {
                let target = localStorage.getItem("currentTargetID");
                let grade = document.getElementById("review-grade").value;
                let author = user.id;
                const res = await fetch(`/review/submit`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        author: author,
                        target_id: target,
                        grade: grade,
                        value: editor.getMarkdown(),
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