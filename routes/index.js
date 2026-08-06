import express from "express";
import Database from "../db.js";
let router = express.Router();

router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/tasks/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const result = await Database.functions.getContent("task", id);
    res.render("viewer", { title: "Twistask", task: result });
  } catch (err) {
    next(err);
  }
});

router.get("/answers/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const result = await Database.functions.getContent("answer", id);
    res.render("viewer", { title: "Twistask", task: result });
  } catch (err) {
    next(err);
  }
});

router.get("/comments/:id", async function (req, res, next) {
  try {
    const id = req.params.id;
    const result = await Database.functions.getContent("comment", id);
    res.render("viewer", { title: "Twistask", task: result });
  } catch (err) {
    next(err);
  }
});

export default router;
