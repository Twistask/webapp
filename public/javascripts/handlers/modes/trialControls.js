let solutions = new Map();
let counter = 0;

let editor;
let viewer;

import { convertToString } from "../../utils/timeConverter.js";

const { tasks = [] } = window.APP || {};

const trial = window.TRIAL || {};
const author = window.AUTHOR || "";

export const TrialControls = {
  setup: () => {
    TrialControls.setupEditor();
    TrialControls.setupTask();
    TrialControls.setupTimer(trial.trialTime);
    TrialControls.setupSubmit();
    TrialControls.blockInput();
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
  setupTask: () => {
    let availableTasks = tasks.filter((t) => t.language === sessionStorage.getItem("language"));
    if (availableTasks.length === 0) {
      viewer.setMarkdown("There are currently no tasks available for a time trial.");
      return;
    }
    const randIndex = Math.floor(Math.random() * availableTasks.length);
    const chosenTask = availableTasks.at(randIndex);
    viewer.setMarkdown(chosenTask.description || "");
    localStorage.setItem("currentTargetID", chosenTask.id);
  },
  setupSubmit: () => {
    let submitbtn = document.getElementById("submit");
    submitbtn.addEventListener("click", async () => {
      const target = localStorage.getItem("currentTargetID");
      if (!target) return;
      TrialControls.setupTask();
      try {
        await TrialControls.submitPuzzle(target, editor.getMarkdown());
      } catch (err) {
        console.error("Failed to submit trial solutions:", err);
        alert("Some of your answers failed to submit. Please check your connection and try again.");
      }
    })
  },
  setupTimer: () => {
    if (trial.trialTime !== undefined && trial.trialTime !== 0) {
      let start = Date.now();
      setTimeout(() => {
        alert("Time's up!");
        window.location.replace("/");
      }, Number(trial.trialTime));
      let time_div = document.createElement("div");
      let timer_value = document.createElement("p");
      setInterval(() => {
        timer_value.innerText = `Time left: ${convertToString(Math.max(0, trial.trialTime - (Date.now() - start)))}`;
      }, 250);
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
      return TrialControls.sendSolutions();
    }
  },
  addSolution: (id, value) => {
    // `counter` must advance on every call, otherwise every solution
    // overwrites the same Map entry and the trial never collects more
    // than one answer.
    solutions.set(counter++, {
      id: id,
      value: value,
    });
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
  try {
    await TrialControls.setup();
  } catch (err) {
    console.error("Failed to set up time trial:", err);
    const workArea = document.getElementById("work-area");
    if (workArea) workArea.innerText = "Something went wrong loading this page. Please refresh and try again.";
  }
})
