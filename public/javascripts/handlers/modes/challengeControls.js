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
        viewer.setMarkdown(task.description);
        editor.reset();
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
                author = user.id;
            }
            const res = await fetch(`/challenge/submit`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    author: author,
                    target_id: target,
                    value: editor.getMarkdown(),
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
