import express from "express";
let router = express.Router();

import Database from "../db.js";

/* GET review page. */
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Database.functions.loadContent("tasks");
    const answers = await Database.functions.loadContent("answers");
    res.render("challenge", { title: "Twistask", tasks, answers });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    let body = req.body;
    const result = await Database.functions.sendContent("comment", body);
    console.log(result);
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
