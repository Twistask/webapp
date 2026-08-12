import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";

/* GET editor page. */
router.get("/", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("../users/login");
  if (res.locals.user.role === "student") return res.redirect("../");
  try {
    res.locals.tasks = await Database.functions.loadContentbyUser(
      "tasks",
      res.locals.user.id,
    );
    res.render("editor");
  } catch (err) {
    next(err);
  }
});

router.post("/submit", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user.role === "student") {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  try {
    const token = req.cookies?.twistask_auth;
    const body = { ...req.body, author: res.locals.user.id };
    await Database.functions.createTask(body, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/update", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user.role === "student") {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  const { id, task } = req.body;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ ok: false, message: "Invalid task id" });
  }
  try {
    // Any teacher account can otherwise update *any* task by id - nothing
    // upstream (route or DB layer) restricted this to the task's own
    // author, so one teacher could silently overwrite another teacher's
    // task content and, since the body below reassigns `author`, hijack
    // its ownership outright.
    const existing = await Database.functions.getContent("task", id);
    if (existing.author !== res.locals.user.id) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    const token = req.cookies?.twistask_auth;
    const body = { ...task, author: res.locals.user.id };
    await Database.functions.updateTask(id, body, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.delete("/delete", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user.role === "student") {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }
  const { id } = req.body;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ ok: false, message: "Invalid task id" });
  }
  try {
    // Same missing-ownership-check issue as /update: without this, any
    // teacher could delete any other teacher's task, cascading away all
    // of its students' answers and reviews too.
    const existing = await Database.functions.getContent("task", id);
    if (existing.author !== res.locals.user.id) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    const token = req.cookies?.twistask_auth;
    await Database.functions.deleteTask(id, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
