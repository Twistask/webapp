import express from "express";
let router = express.Router();

import Database from "../db.js";

/* GET editor page. */
router.get("/", async (req, res, next) => {
  try {
    const token = req.cookies?.twistask_auth;
    if (!token) {
      return res.json({ authenticated: false });
    }

    let user = null;
    try {
      user = await Database.functions.getUserFromToken(token);
    } catch (err) {
      return res.json({ authenticated: false });
    }

    if (!user) return res.json({ authenticated: false });
    const tasks = await Database.functions.loadContentbyUser("tasks", user.record.id);
    res.render("editor", { title: "Twistask", tasks });
  } catch (err) {
    next(err);
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    let body = req.body;
    const result = await Database.functions.createTask(body);
    console.log(result);
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/update", async (req, res, next) => {
  try {
    let body = req.body;
    const result = await Database.functions.updateTask(body.id, body.task);
    console.log(result);
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.delete("/delete", async (req, res, next) => {
  try {
    let body = req.body;
    const result = await Database.functions.deleteTask(body.id);
    console.log(result);
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
