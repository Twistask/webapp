import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";
import createError from "http-errors";
import MailService from "../tools/mail.js";

/* GET review page. */
router.get("/:id", async (req, res, next) => {
  // The login page is at /auth/login, not /users/login - this pointed
  // at a route that doesn't exist (a site-wide bug, see the other
  // routes fixed alongside this one).
  if (!res.locals.auth) return res.redirect("/auth/login");
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    res.locals.answer = await Database.functions.getContent("answer", id);
    // Reviewing your own answer defeats the point of peer review - the
    // old random-pick review flow excluded this explicitly, but nothing
    // stopped a direct link to your own answer here.
    if (res.locals.answer.author === res.locals.user.id) {
      return res.redirect("../tasks");
    }
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.mode = "review";
    res.render("challenge");
  } catch (err) {
    next(err);
  }
});

router.post("/:id", async (req, res, next) => {
  if (!res.locals.auth) return res.status(403).json({ ok: false, message: "Not authenticated" });
  // The target answer is taken from the URL, not the request body - see
  // the matching change in routes/challenge.js for why.
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    const { value } = req.body;
    if (typeof value !== "string" || !value.trim()) {
      return res.status(400).json({ ok: false, message: "Review cannot be empty" });
    }

    // Same self-review guard as the GET route above, enforced here too
    // since this endpoint doesn't otherwise require having gone through
    // that page first.
    const answer = await Database.functions.getContent("answer", id);
    if (answer.author === res.locals.user.id) {
      return res.status(403).json({ ok: false, message: "You cannot review your own answer" });
    }

    const token = req.cookies?.twistask_auth;
    const review = await Database.functions.sendContent("comment", {
      author: res.locals.user.id,
      target_id: id,
      value,
    }, token);

    try {
      const task = await Database.functions.getContent("task", answer.target_id);
      const ansAuthor = answer?.author ? await Database.functions.getUserbyId(answer.author) : null;
      if (ansAuthor?.email) {
        await MailService.sendEmail(ansAuthor.email, "Someone has submitted a review to one of your answers!", "", MailService.prepareTemplate("./tools/mail-templates/review-submit.html", task.title, answer.id));
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
