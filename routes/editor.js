import express from "express";
import Database from "../tools/db.js";
import { isNonEmptyString } from "../utils/validate.js";

const router = express.Router();

// GET /editor
router.get("/", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("/users/login");

  if (res.locals.user?.role === "student") return res.redirect("/");

  try {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(401).json({ authenticated: false });

    const tasks = await Database.functions.loadContentbyUser("tasks", userId);
    return res.render("editor", { title: "Twistask", tasks });
  } catch (err) {
    return next(err);
  }
});

// POST /editor/submit
router.post("/submit", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user?.role === "student") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  try {
    const body = req.body || {};
    if (!body || typeof body !== "object") {
      return res.status(400).json({ ok: false, error: "invalid body" });
    }
    if (!isNonEmptyString(body.title) || !isNonEmptyString(body.content)) {
      return res.status(400).json({ ok: false, error: "missing title or content" });
    }

    const created = await Database.functions.createTask({
      title: String(body.title).slice(0, 300),
      content: String(body.content).slice(0, 20000),
      author: res.locals.user.id,
    });

    return res.status(201).json({ ok: true, id: created?.id ?? null });
  } catch (err) {
    return next(err);
  }
});

// POST /editor/update
router.post("/update", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user?.role === "student") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  try {
    const body = req.body || {};
    const id = String(body.id || "").trim();
    const task = body.task;
    if (!isNonEmptyString(id) || !task) {
      return res.status(400).json({ ok: false, error: "missing id or task" });
    }
    await Database.functions.updateTask(id, task);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// DELETE /editor/delete
router.delete("/delete", async (req, res, next) => {
  if (!res.locals.auth || res.locals.user?.role === "student") {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }
  try {
    const body = req.body || {};
    const id = String(body.id || "").trim();
    if (!isNonEmptyString(id)) return res.status(400).json({ ok: false, error: "missing id" });
    await Database.functions.deleteTask(id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
