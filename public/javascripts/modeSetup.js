import {TrialControls} from "./utils/trialControls.js";
import quill from "./baseSetup.js";

const { tasks = [], answers = [] } = window.APP || {};
let mode = localStorage.getItem("mode");

let setupMode = () => {
        switch (mode) {
        case "challenge": {
            createChallengeItems(tasks);
            document.getElementById("challenge-select").onchange = setupTask;
            setupTask();
            break;
        }
        case "review": {
            setupTask();
            break;
        }
        case "timeTrial": {
            let sound = new Audio()
            sound.src = "../sounds/trial-theme.mp3";
            document.body.appendChild(sound);
            sound.volume = 0.3;
            sound.loop = true;
            sound.play();
            setupTask();
            TrialControls.setupTimer();
            TrialControls.blockInput();
        }
    }
}

function createChallengeItems(items) {
    let select = document.getElementById("challenge-select");
    items.forEach(item => {
        let opt = document.createElement("option");
        opt.value = item.id;
        opt.innerHTML = item.title;
        select.appendChild(opt);
    })
}

let setupTask = () => {
        switch (mode) {
            case "challenge": {
                const value = document.getElementById("challenge-select").value;
                const task = tasks.find(t => t.id === value);
                document.getElementById("task-area").innerHTML = task.description;
                localStorage.setItem("currentTargetID", task.id);
                break;
            }
            case "review": {
                const answersForTask = answers.filter(a => a.value && a.value.trim() !== '');
                if (!answersForTask.length || !tasks.length) {
                    console.warn('no answers or tasks available');
                    return;
                }

                const randIndex = Math.floor(Math.random() * answersForTask.length);
                let chosenAnswer = answersForTask[randIndex];
                const task = tasks.find(t => t.id === chosenAnswer.target_id);

                if (!task) {
                    console.warn('no matching task for answer', chosenAnswer);
                    return;
                }

                document.getElementById('task-area').innerHTML = task.description;
                document.getElementById('review-answer-area').innerHTML = chosenAnswer.value;
                localStorage.setItem("currentTargetID", chosenAnswer.id);
                break;
            }
            case "timeTrial": {
                const randIndex = Math.floor(Math.random() * tasks.length);
                let chosenTask;
                chosenTask = tasks[randIndex];
                document.getElementById("task-area").innerHTML = chosenTask.description;
                localStorage.setItem("currentTargetID", chosenTask.id);
            }
        }
}

let setupSubmit = () => {
    let submitbtn = document.getElementById("submit");
    if (submitbtn) {
        submitbtn.addEventListener("click", async () => {
            let target = localStorage.getItem("currentTargetID");
            let grade = undefined;
            if (document.getElementById("review-grade") !== null) {
                grade = document.getElementById("review-grade").value;
            }
            let sound = new Audio()
            sound.src = "../sounds/emblem.wav";
            document.body.appendChild(sound);
            sound.volume = 0.5;
            await sound.play();
            switch (mode) {
                case "review":
                case "challenge": {
                    const res = await fetch(`/${mode}/submit`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            "target_id": target,
                            "grade": grade,
                            "value": quill.getSemanticHTML()
                        })
                    });
                    break;
                }
                case "timeTrial": {
                    setupTask();
                    TrialControls.submitPuzzle(target, quill.getSemanticHTML());
                }
            }
        })
    }
}

setupMode();
setupSubmit();