let solutions = new Map();
let trialTime = localStorage.getItem("trialTime");
let tasksNum = Number(localStorage.getItem("tasks_number"));
let counter = 0;

import {convertToString} from "./timeConverter.js";

export const TrialControls = {
    setupTimer: () => {
        let start = Date.now();
        setTimeout(() => {
            alert("Time's up!");
            window.location.href = "/";
        }, Number(trialTime));
        let time_div = document.createElement("div");
        let timer_value = document.createElement("p");
        setInterval(() => {
            timer_value.innerText = `Time left: ${convertToString(Math.max(0, trialTime - (Date.now() - start)))}`
        }, 1)
        time_div.append(timer_value);
        let work_area = document.getElementById("work-area");
        work_area.append(time_div);
    },
    blockInput: () => {
        document.addEventListener("keydown", function (event) {
            const isF5 = event.key === "F5"
            const isCtrlR = event.ctrlKey && (event.key === "r" || event.key === "R");

            if (isF5 || isCtrlR) {
                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        });
    },
    submitPuzzle: (id, value) => {
        TrialControls.addSolution(id, value);
        counter++;
        if (counter === tasksNum) {
            TrialControls.sendSolutions();
            TrialControls.endTrial();
        }
    },
    addSolution: (id, value) => {
        solutions.set(counter, {
            id: id,
            value: value
        });
        console.log(solutions);
    },
    clearSolutions: () => {
        solutions.clear()
    },
    sendSolutions: () => {
        solutions.forEach(async (ans) => {
            const res = await fetch(`/challenge/submit`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "target_id": ans.id,
                    "value": ans.value
                })
            });
        })
    },
    endTrial: () => {
        window.location.href += "/result";
        localStorage.setItem("mode", "trialClear");
    }
}