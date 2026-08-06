import express from "express";
let router = express.Router();

import Database from "../db.js";

router.get("/", async (req, res, next) => {
  try {
    res.render("timeTrial/start");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/challenge", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "timeTrial";
    res.locals.difficulty = req.body.difficulty;
    let trialTime;
    let tasksAmount;
    switch (req.body.difficulty) {
      case "easy": {
        trialTime = 30 * 60 * 1000;
        tasksAmount = req.body.tasksAmount;
        break;
      }
      case "medium": {
        trialTime = 20 * 60 * 1000;
        tasksAmount = req.body.tasksAmount;
        break;
      }
      case "hard": {
        trialTime = 15 * 60 * 1000;
        tasksAmount = req.body.tasksAmount;
        break;
      }
      case "superHard": {
        trialTime = 0;
        tasksAmount = res.locals.tasks.length;
      }
    }
    res.locals.trialTime = trialTime;
    res.locals.tasksAmount = tasksAmount;
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
