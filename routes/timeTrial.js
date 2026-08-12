import express from "express";
let router = express.Router();

import Database from "../tools/db.js";

const DIFFICULTY_TIME_SETTINGS = {
  easy: 30 * 60 * 1000,
  medium: 20 * 60 * 1000,
  hard: 15 * 60 * 1000,
  superHard: 0,
};

const DIFFICULTY_TASK_SETTINGS = {
  easy: 3,
  medium: 5,
  hard: 7,
  superHard: 9999999,
};

router.get("/", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.render("timeTrial/start");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/start", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "timeTrial";

    const difficulty = req.body.difficulty;
    if (!Object.prototype.hasOwnProperty.call(DIFFICULTY_TIME_SETTINGS, difficulty)) {
      return res.status(400).json({ ok: false, message: "Invalid difficulty" });
    }

    const trialTime = DIFFICULTY_TIME_SETTINGS[difficulty];
    const tasksAmount = DIFFICULTY_TASK_SETTINGS[difficulty];

    if (!Number.isFinite(tasksAmount) || tasksAmount < 1 || tasksAmount > res.locals.tasks.length) {
      return res.status(400).json({ ok: false, message: "Invalid tasksAmount" });
    }

    res.locals.trial = { difficulty, trialTime, tasksAmount };

    // Authenticated users can never start a trial as someone else; guests
    // supply a free-text name instead (see views/timeTrial/start.ejs).
    if (res.locals.auth) {
      res.locals.author = res.locals.user.id;
    } else {
      const author = String(req.body.author || "").trim().slice(0, 100);
      if (!author) {
        return res.status(400).json({ ok: false, message: "Name is required" });
      }
      res.locals.author = author;
    }

    res.render("challenge");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.get("/result", async (req, res, next) => {
  try {
    res.render("timeTrial/result");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
