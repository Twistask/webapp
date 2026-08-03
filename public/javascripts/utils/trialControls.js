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
    submitPuzzle: async (id, value) => {
        TrialControls.addSolution(id, value);
        if (solutions.size >= tasksNum) {
            TrialControls.sendSolutions().then(r => {
                console.log("Trial over!!!!")
            });
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
    sendSolutions: async () => {
        const promises = Array.from(solutions, ([, ans]) => {
            return fetch('/challenge/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ target_id: ans.id, value: ans.value })
            })
                .then(res => ({ id: ans.id, ok: res.ok, status: res.status }))
                .catch(err => ({ id: ans.id, ok: false, error: String(err) }));
        });

        const results = await Promise.all(promises);

        const anyFailed = results.some(r => !r.ok);
        if (anyFailed) {
            console.error('Some submissions failed', results);
            // decide whether to throw or return results for caller to handle
            throw new Error('One or more submissions failed');
        }

        solutions.clear();
        return TrialControls.endTrial();
    },
    endTrial: () => {
        localStorage.setItem("mode", "trialClear");
        window.location.assign('/challenge/result');
    }
}