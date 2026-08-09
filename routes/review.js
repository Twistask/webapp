import express from "express";
let router = express.Router();

import Database from "../tools/db.js";

/* GET review page. */
router.get("/", async (req, res, next) => {
  if (!res.locals.auth) res.redirect("../users/login");
  try {
    res.locals.mode = "review";
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.answers = await Database.functions.loadContent("answers");
    res.render("challenge");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/submit", async (req, res, next) => {
  if (!res.locals.auth) res.status(403);
  try {
    let body = req.body;
    const result = await Database.functions.sendContent("comment", body);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
