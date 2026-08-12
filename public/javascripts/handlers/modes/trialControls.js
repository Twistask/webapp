let solutions = new Map();
let counter = 0;
let trialStartTime = 0;

let editor;
let viewer;

import { convertToString } from "../../utils/timeConverter.js";

const { tasks = [] } = window.APP || {};

const trial = window.TRIAL || {};
const author = window.AUTHOR || "";

export const TrialControls = {
  setup: () => {
    trialStartTime = Date.now();
    TrialControls.setupEditor();
    TrialControls.setupTask();
    TrialControls.setupTimer(trial.trialTime);
    TrialControls.setupSubmit();
    TrialControls.setupGiveUp();
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
    const titleEl = document.getElementById("task-title");
    if (availableTasks.length === 0) {
      if (titleEl) titleEl.textContent = "";
      viewer.setMarkdown("There are currently no tasks available for a time trial.");
      return;
    }
    const randIndex = Math.floor(Math.random() * availableTasks.length);
    const chosenTask = availableTasks.at(randIndex);
    if (titleEl) titleEl.textContent = chosenTask.title;
    viewer.setMarkdown(chosenTask.description || "");
    editor.reset();
    localStorage.setItem("currentTargetID", chosenTask.id);
  },
  setupSubmit: () => {
    let submitbtn = document.getElementById("submit");
    submitbtn.addEventListener("click", async () => {
      const target = localStorage.getItem("currentTargetID");
      if (!target) return;
      // Capture the answer before setupTask() below loads the next task
      // and resets the editor - reading it after would submit blank
      // content instead of what was just typed.
      const value = editor.getMarkdown();
      TrialControls.setupTask();
      try {
        await TrialControls.submitPuzzle(target, value);
      } catch (err) {
        console.error("Failed to submit trial solutions:", err);
        alert("Some of your answers failed to submit. Please check your connection and try again.");
      }
    })
  },
  setupGiveUp: () => {
    // In timeTrial mode this is the "Give Up" link in #trial-menu, not
    // the normal nav's home link (menu.ejs only renders one or the
    // other). Intercepted so whatever's already been answered still
    // gets submitted instead of silently discarded on the way out.
    const giveUpLink = document.getElementById("home-link");
    if (!giveUpLink) return;
    giveUpLink.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const confirmed = confirm("Give up on this trial? Your current answer will still be submitted, but the trial will end early.");
      if (!confirmed) return;
      await TrialControls.flushAndFinish("gaveUp");
    });
  },
  setupTimer: () => {
    if (trial.trialTime !== undefined && trial.trialTime !== 0) {
      let start = trialStartTime;
      setTimeout(() => {
        TrialControls.flushAndFinish("timeout");
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
      const { solvedIds, failedCount } = await TrialControls.sendSolutions();
      if (failedCount > 0) {
        throw new Error(`${failedCount} answer(s) failed to submit`);
      }
      TrialControls.finishTrial("completed", solvedIds);
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
  // Ends the trial early (timeout or give-up): submits whatever answers
  // are already sitting in `solutions` - previously these were only ever
  // sent once the *full* tasksAmount was reached, so running out of time
  // or giving up lost every answer that hadn't already completed a full
  // batch, even ones the player had actually finished typing.
  flushAndFinish: async (status) => {
    let solvedIds = [];
    if (solutions.size > 0) {
      try {
        const result = await TrialControls.sendSolutions();
        solvedIds = result.solvedIds;
      } catch (err) {
        console.error("Failed to submit remaining trial solutions:", err);
      }
    }
    TrialControls.finishTrial(status, solvedIds);
  },
  sendSolutions: async () => {
    // /challenge/submit no longer exists - challenge.js now routes per
    // task as /challenge/:id. Posting to the old URL didn't 404 (it
    // matched /challenge/:id with id="submit" instead) so every trial
    // submission was silently failing against a bogus task id.
    const entries = Array.from(solutions.values());
    const promises = entries.map((ans) =>
      fetch(`/challenge/${ans.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ author: author, value: ans.value }),
      })
        .then((res) => ({ id: ans.id, ok: res.ok, status: res.status }))
        .catch((err) => ({ id: ans.id, ok: false, error: String(err) }))
    );

    const results = await Promise.all(promises);
    solutions.clear();

    const solvedIds = results.filter((r) => r.ok).map((r) => r.id);
    const failedCount = results.length - solvedIds.length;
    return { solvedIds, failedCount };
  },
  // Stashes a summary in sessionStorage for the result page to render,
  // then navigates there. Kept separate from sendSolutions() since the
  // three ways a trial can end (finish normally, time out, give up) all
  // need this, but only some of them send anything first.
  finishTrial: (status, solvedIds) => {
    const solvedTasks = solvedIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean)
      .map((t) => ({ id: t.id, title: t.title }));

    sessionStorage.setItem(
      "trialResult",
      JSON.stringify({
        status,
        difficulty: trial.difficulty,
        tasksAmount: trial.tasksAmount,
        solvedTasks,
        timeTakenMs: Date.now() - trialStartTime,
      }),
    );

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
