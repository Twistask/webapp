import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import MailService from "../tools/mail.js";
import { isValidRecordId } from "./utils/validateId.js";
import createError from "http-errors";

router.get("/:id", async (req, res, next) => {
  // Anonymous "guest" challenge mode is a supported flow (see the
  // author-name field in challenge.ejs and the guest branch in POST
  // below) - this must stay reachable without logging in.
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
  // The target task is taken from the URL, not the request body - the
  // client used to also send a `target_id` field that could disagree
  // with the URL it was posted to for no good reason.
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    const { value } = req.body;
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ ok: false, message: "Answer cannot be empty" });
    }

    // Authenticated users can never submit as someone else; guests
    // (anonymous challenge mode) supply a free-text name instead.
    const author = res.locals.auth
      ? res.locals.user.id
      : String(req.body.author || "").trim().slice(0, 100);

    if (!author) {
      return res.status(400).json({ ok: false, message: "Missing author" });
    }

    // The answer inherits the task's language. This used to be a
    // client-supplied `language: sessionStorage.getItem("language")`
    // field (the submitter's current UI language selection), but that
    // stopped being sent during the challenge/review rewrite and the
    // server never picked it back up - every answer since has been
    // saved with an empty language. Deriving it from the task here
    // instead of trusting the client also means it can't drift from the
    // task actually being answered, which a client-supplied value could
    // (this flow lets you open /challenge/:id for any task directly,
    // without first filtering task choice by your current language).
    const task = await Database.functions.getContent("task", id);

    const token = req.cookies?.twistask_auth;
    const ans = await Database.functions.sendContent(
      "answer",
      { author, target_id: id, value, language: task.language },
      token,
    );

    // Best-effort notification: a lookup/mail failure here must not turn a
    // successful submission into a 500 for the client.
    try {
      const taskAuthor = task?.author ? await Database.functions.getUserbyId(task.author) : null;
      if (taskAuthor?.email) {
        await MailService.sendEmail(taskAuthor.email, "Someone has submitted an answer to one of your tasks!", "", MailService.prepareTemplate("./tools/mail-templates/answer-submit.html", task.title, ans.id));
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
