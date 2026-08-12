import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import MailService from "../tools/mail.js";
import { isValidRecordId } from "./utils/validateId.js";
import createError from "http-errors";

router.get("/:id", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("../users/login");
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    res.locals.task = await Database.functions.getContent("task", id);
    res.locals.mode = "challenge";
    res.render("challenge");
  } catch (err) {
    next(err);
  }
});

router.post("/:id", async (req, res, next) => {
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
