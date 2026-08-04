import { TrialControls } from "./utils/trialControls.js";
import Controls from "./baseSetup.js";
import { checkAuthStatus } from "./handlers/users/authHelper.js";

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
      let sound = new Audio();
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
};

function createChallengeItems(items) {
  let select = document.getElementById("challenge-select");
  items.forEach((item) => {
    let opt = document.createElement("option");
    opt.value = item.id;
    opt.innerHTML = item.title;
    select.appendChild(opt);
  });
}

let setupTask = async () => {
  switch (mode) {
    case "challenge": {
      const value = document.getElementById("challenge-select").value;
      const task = tasks.find((t) => t.id === value);
      Controls.viewer.setMarkdown(task.description);
      localStorage.setItem("currentTargetID", task.id);
      break;
    }
    case "review": {
      let auth = await checkAuthStatus();
      let author;
      if (auth.authenticated) author = auth.user.record.id;
      else author = "guest";
      const answersForTask = answers.filter(
        (a) => a.value && a.value.trim() !== "" && a.author !== author,
      );
      if (!answersForTask.length || !tasks.length) {
        document.getElementById("work-area").innerHTML =
          "There are currently no answers to review!";
        return;
      }

      const randIndex = Math.floor(Math.random() * answersForTask.length);
      let chosenAnswer = answersForTask[randIndex];
      const task = tasks.find((t) => t.id === chosenAnswer.target_id);

      if (!task) {
        document.getElementById("work-area").innerHTML =
            "There are currently no answers to review!";
        return;
      }

      Controls.viewer.setMarkdown(task.description);
      Controls.review_viewer.setMarkdown(chosenAnswer.value);
      localStorage.setItem("currentTargetID", chosenAnswer.id);
      break;
    }
    case "timeTrial": {
      const randIndex = Math.floor(Math.random() * tasks.length);
      let chosenTask;
      chosenTask = tasks[randIndex];
      Controls.viewer.setMarkdown(chosenTask.description);
      localStorage.setItem("currentTargetID", chosenTask.id);
    }
  }
};

let setupSubmit = () => {
  let submitbtn = document.getElementById("submit");
  if (submitbtn) {
    submitbtn.addEventListener("click", async () => {
      let target = localStorage.getItem("currentTargetID");
      let grade = undefined;
      let author;
      if (document.getElementById("review-grade") !== null) {
        grade = document.getElementById("review-grade").value;
      }
      if (document.getElementById("author-name") !== null) {
        author = document.getElementById("author-name").value;
      } else {
        let auth = await checkAuthStatus();
        author = auth.user.record.id;
      }
      let sound = new Audio();
      sound.src = "../sounds/emblem.wav";
      document.body.appendChild(sound);
      sound.volume = 0.5;
      await sound.play();
      switch (mode) {
        case "review":
        case "challenge": {
          const res = await fetch(`/${mode}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              author: author,
              target_id: target,
              grade: grade,
              value: Controls.editor.getMarkdown(),
            }),
          });
          break;
        }
        case "timeTrial": {
          setupTask();
          await TrialControls.submitPuzzle(
            target,
            Controls.editor.getMarkdown(),
          );
        }
      }
    });
  }
};

setupMode();
setupSubmit();
