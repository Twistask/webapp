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
    res.locals.main = await Database.functions.getContent("answer", id);
    res.locals.children = await Database.functions.getCommentsForAnswer(id);
    res.locals.childType = "comment";
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

export default router;
