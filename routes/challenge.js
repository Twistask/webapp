import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import MailService from "../tools/mail.js";
import { isValidRecordId } from "./utils/validateId.js";

router.get("/", async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "challenge";
    if (res.locals.user) res.locals.author = res.locals.user.id;
    res.render("challenge");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/submit", async (req, res, next) => {
  try {
    const { target_id, value } = req.body;
    if (!isValidRecordId(target_id)) {
      return res.status(400).json({ ok: false, message: "Invalid task id" });
    }

    // Authenticated users can never submit as someone else; guests
    // (anonymous challenge mode) supply a free-text name instead.
    const author = res.locals.auth
      ? res.locals.user.id
      : String(req.body.author || "").trim().slice(0, 100);

    if (!author) {
      return res.status(400).json({ ok: false, message: "Missing author" });
    }

    const token = req.cookies?.twistask_auth;
    await Database.functions.sendContent("answer", { author, target_id, value }, token);

    // Best-effort notification: a lookup/mail failure here must not turn a
    // successful submission into a 500 for the client.
    try {
      const task = await Database.functions.getContent("task", target_id);
      const taskAuthor = task?.author ? await Database.functions.getUserbyId(task.author) : null;
      if (taskAuthor?.email) {
        await MailService.sendEmail(taskAuthor.email, "Your task has been solved!", "Your task has been solved!");
      }
    } catch (notifyErr) {
      console.error("Failed to send task-solved notification:", notifyErr?.message ?? notifyErr);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
