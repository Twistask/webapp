import express from "express";
let router = express.Router();

import Database from "../tools/db.js";

/* GET editor page. */
router.get("/", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("../users/login");
  if (res.locals.auth && res.locals.user.role === "student") return res.redirect("../");
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
    const tasks = await Database.functions.loadContentbyUser(
      "tasks",
      user.record.id,
    );
    res.render("editor", { title: "Twistask", tasks });
  } catch (err) {
    next(err);
  }
});

router.post("/submit", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user.role === "student") return res.status(403);
  try {
    let body = req.body;
    const result = await Database.functions.createTask(body);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/update", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user.role === "student") return res.status(403);
  try {
    let body = req.body;
    const result = await Database.functions.updateTask(body.id, body.task);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.delete("/delete", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user.role === "student") return res.status(403);
  try {
    let body = req.body;
    const result = await Database.functions.deleteTask(body.id);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
