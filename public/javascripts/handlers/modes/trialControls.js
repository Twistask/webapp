import Controls from "../../baseSetup.js";

let solutions = new Map();
let counter = 0;

import { convertToString } from "../../utils/timeConverter.js";

const { tasks = [] } = window.APP || {};

const trial = window.TRIAL || {};
const author = window.AUTHOR || "";

export const TrialControls = {
  setup: () => {
    let sound = new Audio();
    sound.src = "../sounds/trial-theme.mp3";
    document.body.appendChild(sound);
    sound.volume = 0.3;
    sound.loop = true;
    sound.play();
    TrialControls.setupTask();
    TrialControls.setupTimer(trial.trialTime);
    TrialControls.setupSubmit();
    TrialControls.blockInput();
  },
  setupTask: () => {
    const randIndex = Math.floor(Math.random() * tasks.length);
    let chosenTask;
    chosenTask = tasks[randIndex];
    Controls.viewer.setMarkdown(chosenTask.description);
    localStorage.setItem("currentTargetID", chosenTask.id);
  },
  setupSubmit: () => {
    let submitbtn = document.getElementById("submit");
    let target = localStorage.getItem("currentTargetID");
    submitbtn.addEventListener("click", async () => {
      TrialControls.setupTask();
      await TrialControls.submitPuzzle(
          target,
          Controls.editor.getMarkdown(),
      );
    })
  },
  setupTimer: () => {
    if (trial.trialTime !== undefined && trial.trialTime !== 0) {
      let start = Date.now();
      setTimeout(() => {
        alert("Time's up!");
        window.location.href = "/";
      }, Number(trial.trialTime));
      let time_div = document.createElement("div");
      let timer_value = document.createElement("p");
      setInterval(() => {
        timer_value.innerText = `Time left: ${convertToString(Math.max(0, trial.trialTime - (Date.now() - start)))}`;
      }, 1);
      time_div.append(timer_value);
      let menu = document.getElementById("trial-menu");
      menu.append(time_div);
    }
  },
  blockInput: () => {
    document.addEventListener("keydown", function (event) {
      const isF5 = event.key === "F5";
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
    if (solutions.size >= trial.tasksAmount) {
      TrialControls.sendSolutions().then((r) => {
        console.log("Trial over!!!!");
      });
    }
  },
  addSolution: (id, value) => {
    solutions.set(counter, {
      id: id,
      value: value,
    });
    console.log(solutions);
  },
  sendSolutions: async () => {
    const promises = Array.from(solutions, ([, ans]) => {
      return fetch("/challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ author: author, target_id: ans.id, value: ans.value }),
      })
        .then((res) => ({ id: ans.id, ok: res.ok, status: res.status }))
        .catch((err) => ({ id: ans.id, ok: false, error: String(err) }));
    });

    const results = await Promise.all(promises);

    const anyFailed = results.some((r) => !r.ok);
    if (anyFailed) {
      console.error("Some submissions failed", results);
      throw new Error("One or more submissions failed");
    }

    solutions.clear();
    return TrialControls.endTrial();
  },
  endTrial: () => {
    window.location.replace("/timeTrial/result");
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  await TrialControls.setup();
})
