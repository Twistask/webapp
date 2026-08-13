import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";

/* GET editor page. */
router.get("/", async (req, res, next) => {
  // The login page is at /auth/login, not /users/login - this pointed
  // at a route that doesn't exist (a site-wide bug, see the other
  // routes fixed alongside this one). Absolute, not relative: safe
  // regardless of how this route is nested/mounted.
  if (!res.locals.auth) return res.redirect("/auth/login");
  if (res.locals.user.role === "student") return res.redirect("/");
  try {
    if (res.locals.user.role === "admin") res.locals.tasks = await Database.functions.loadContent("tasks");
    else res.locals.tasks = await Database.functions.loadContentbyUser(
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
    if (existing.author !== res.locals.user.id && res.locals.user.role !== "admin") {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    const token = req.cookies?.twistask_auth;
    // Preserve the task's real author rather than always reassigning to
    // whoever's editing - otherwise an admin fixing a typo in someone
    // else's task would silently strip that teacher of ownership (it
    // would vanish from their own "My Tasks" list) and hand it to the
    // admin instead.
    const body = { ...task, author: existing.author };
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
    if (existing.author !== res.locals.user.id && res.locals.user.role !== "admin") {
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
