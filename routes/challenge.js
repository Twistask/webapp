import express from "express";
import Database from "../tools/db.js";
import MailService from "../tools/mail.js";
import { isNonEmptyString } from "../utils/validate.js";

const router = express.Router();

// GET /challenge
router.get("/", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "challenge";
    if (res.locals.user) res.locals.author = res.locals.user.id;
    return res.render("challenge");
  } catch (err) {
    return next(err);
  }
});

// POST /challenge/submit - anonymous submissions allowed
router.post("/submit", async (req, res, next) => {
  try {
    const body = req.body || {};
    const targetId = String(body.target_id || "").trim();
    const content = String(body.content || body.answer || body.text || "").trim();

    if (!isNonEmptyString(targetId)) {
      return res.status(400).json({ ok: false, error: "missing target_id" });
    }
    if (!isNonEmptyString(content)) {
      return res.status(400).json({ ok: false, error: "missing content" });
    }

    const answer = await Database.functions.sendContent("answer", {
      target_id: targetId,
      content: content.slice(0, 20000),
      author: res.locals.user?.id ?? null,
    });

    // best-effort notify
    (async () => {
      try {
        const task = await Database.functions.getContent("task", targetId);
        if (task && task.author) {
          const user = await Database.functions.getUserbyId(task.author);
          if (user && user.email) {
            const mailResult = await MailService.sendEmail(
              user.email,
              "Your task has been solved!",
              "Your task has been solved!",
            );
            if (!mailResult.success) console.warn("challenge.submit: mail failed", mailResult.error);
          }
        }
      } catch (notifyErr) {
        console.warn("challenge.submit: notification failed:", notifyErr?.message ?? notifyErr);
      }
    })();

    return res.status(200).json({ ok: true, id: answer?.id ?? null });
  } catch (err) {
    return next(err);
  }
});

export default router;
