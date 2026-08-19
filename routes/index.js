import express from "express";
import createError from "http-errors";
import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";
let router = express.Router();

router.get("/", async function (req, res, next) {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.render("index");
  } catch (err) {
    next(err);
  }
});

router.get("/tasks", async function (req, res, next) {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.render("tasks");
  } catch (err) {
    next(err);
  }
});

router.get("/tasks/:id", async function (req, res, next) {
  // The login page is at /auth/login, not /users/login - this pointed
  // at a route that doesn't exist (a site-wide bug, see the other
  // routes fixed alongside this one).
  if (!res.locals.auth) return res.redirect("/auth/login");
  if (res.locals.user.role === "student") return res.redirect("/");
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    res.locals.main = await Database.functions.getContent("task", id);
    res.locals.children = await Database.functions.getAnswersForTask(id);
    res.locals.childType = "answer";
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

router.get("/answers/:id", async function (req, res, next) {
  if (!res.locals.auth) return res.redirect("/auth/login");
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    const answer = await Database.functions.getContent("answer", id);
    const comments = await Database.functions.getCommentsForAnswer(id);

    // This page is only ever linked to the answer's own author (profile
    // "View your answer", the review-submitted email) or to someone who
    // reviewed it (profile "View your review") - plus the task's teacher
    // and admins have a legitimate reason to check on it. Anyone else who
    // merely knows/guesses the id has no business reading another
    // student's submission and the feedback on it.
    const user = res.locals.user;
    const isOwner = answer.author === user.id;
    const isReviewer = comments.some((c) => c.author === user.id);
    const isAdmin = user.role === "admin";
    let isTaskAuthor = false;
    if (!isOwner && !isReviewer && !isAdmin) {
      const task = await Database.functions.getContent("task", answer.target_id);
      isTaskAuthor = task?.author === user.id;
    }
    if (!isOwner && !isReviewer && !isAdmin && !isTaskAuthor) {
      return next(createError(404));
    }

    res.locals.main = answer;
    res.locals.children = comments;
    res.locals.childType = "comment";
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

export default router;
