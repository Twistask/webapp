import express from "express";
import Database from "../tools/db.js";
import { isNonEmptyString } from "../utils/validate.js";

const router = express.Router();

const requireParam = (res, name, value) => {
  if (!value) {
    res.status(400).render("service/error", { message: `Missing parameter: ${name}` });
    return false;
  }
  return true;
};

router.get("/", (req, res) => {
  res.render("index");
});

// Show a task viewer — only for authenticated non-students (original intent preserved)
router.get("/tasks/:id", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("/users/login");
  if (res.locals.user?.role === "student") return res.redirect("/");

  const id = String(req.params.id || "").trim();
  if (!requireParam(res, "id", id)) return;

  try {
    const main = await Database.functions.getContent("task", id);
    if (!main) {
      return res.status(404).render("service/error", { message: "Task not found" });
    }
    const children = await Database.functions.getAnswersForTask(id);
    res.locals.main = main;
    res.locals.children = children;
    return res.render("viewer");
  } catch (err) {
    return next(err);
  }
});

// View an answer (allows anonymous view)
router.get("/answers/:id", async (req, res, next) => {
  const id = String(req.params.id || "").trim();
  if (!requireParam(res, "id", id)) return;

  try {
    const main = await Database.functions.getContent("answer", id);
    if (!main) return res.status(404).render("service/error", { message: "Answer not found" });
    const children = await Database.functions.getCommentsForAnswer(id);
    res.locals.main = main;
    res.locals.children = children;
    return res.render("viewer");
  } catch (err) {
    return next(err);
  }
});

export default router;
