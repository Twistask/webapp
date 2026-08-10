import express from "express";
import Database from "../tools/db.js";
import { toSafeInt } from "../utils/validate.js";

const router = express.Router();

const DIFFICULTY_CONFIG = {
  easy: { ms: 30 * 60 * 1000 },
  medium: { ms: 20 * 60 * 1000 },
  hard: { ms: 15 * 60 * 1000 },
  superHard: { ms: 0 },
};

router.get("/", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    return res.render("timeTrial/start");
  } catch (err) {
    return next(err);
  }
});

router.post("/start", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "timeTrial";

    const difficulty = String(req.body.difficulty || "easy").trim();
    if (!Object.prototype.hasOwnProperty.call(DIFFICULTY_CONFIG, difficulty)) {
      return res.status(400).render("service/error", { message: "invalid difficulty" });
    }

    const tasksAmountRequested = toSafeInt(req.body.tasksAmount, 0);
    const totalAvailable = (res.locals.tasks || []).length;
    const tasksAmount =
      difficulty === "superHard" ? totalAvailable : Math.max(1, Math.min(tasksAmountRequested || 1, totalAvailable || 1));

    res.locals.trial = {
      difficulty,
      trialTime: DIFFICULTY_CONFIG[difficulty].ms,
      tasksAmount,
    };

    res.locals.author = res.locals.user?.id ?? req.body.author ?? null;

    return res.render("challenge");
  } catch (err) {
    return next(err);
  }
});

router.get("/result", async (req, res, next) => {
  try {
    return res.render("timeTrial/result");
  } catch (err) {
    return next(err);
  }
});

export default router;
