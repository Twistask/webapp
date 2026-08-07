import express from "express";
import Database from "../db.js";
let router = express.Router();

router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/tasks/:id", async function (req, res, next) {
  if (!res.locals.auth) res.redirect("../users/login");
  try {
    const id = req.params.id;
    res.locals.main = await Database.functions.getContent("task", id);
    res.locals.children = await Database.functions.getAnswersForTask(id);
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

router.get("/answers/:id", async function (req, res, next) {
  if (!res.locals.auth) res.redirect("../users/login");
  try {
    const id = req.params.id;
    res.locals.main = await Database.functions.getContent("answer", id);
    res.locals.children = await Database.functions.getCommentsForAnswer(id);
    res.render("viewer");
  } catch (err) {
    next(err);
  }
});

export default router;
