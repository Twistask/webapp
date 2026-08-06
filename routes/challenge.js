import express from "express";
let router = express.Router();

import Database from "../db.js";

router.get("/", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "challenge";
    res.render("challenge");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    let body = req.body;
    const result = await Database.functions.sendContent("answer", body);
    if (result) res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
