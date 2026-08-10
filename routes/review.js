import express from "express";
import Database from "../tools/db.js";
import { isNonEmptyString } from "../utils/validate.js";

const router = express.Router();

// GET /review
router.get("/", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("/users/login");
  try {
    res.locals.mode = "review";
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.answers = await Database.functions.loadContent("answers");
    return res.render("challenge");
  } catch (err) {
    return next(err);
  }
});

// POST /review/submit
router.post("/submit", async (req, res, next) => {
  if (!res.locals.auth) return res.status(403).json({ ok: false, error: "forbidden" });
  try {
    const body = req.body || {};
    const targetId = String(body.target_id || "").trim();
    const text = String(body.text || body.comment || "").trim();

    if (!isNonEmptyString(targetId) || !isNonEmptyString(text)) {
      return res.status(400).json({ ok: false, error: "missing target_id or text" });
    }

    await Database.functions.sendContent("comment", {
      target_id: targetId,
      text: text.slice(0, 5000),
      author: res.locals.user.id,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
