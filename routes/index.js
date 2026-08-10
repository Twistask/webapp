import express from "express";
import createError from "http-errors";
import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";
let router = express.Router();

router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/tasks/:id", async function (req, res, next) {
  if (!res.locals.auth) return res.redirect("../users/login");
  if (res.locals.user.role === "student") return res.redirect("../");
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    res.locals.main = await Database.functions.getContent("task", id);
    res.locals.children = await Database.functions.getAnswersForTask(id);
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

router.get("/answers/:id", async function (req, res, next) {
  if (!res.locals.auth) return res.redirect("../users/login");
  const id = req.params.id;
  if (!isValidRecordId(id)) return next(createError(404));
  try {
    res.locals.main = await Database.functions.getContent("answer", id);
    res.locals.children = await Database.functions.getCommentsForAnswer(id);
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

export default router;
