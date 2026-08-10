import express from "express";
let router = express.Router();

import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";

/* GET review page. */
router.get("/", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("../users/login");
  try {
    res.locals.mode = "review";
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.answers = await Database.functions.loadContent("answers");
    res.render("challenge");
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

router.post("/submit", async (req, res, next) => {
  if (!res.locals.auth) return res.status(403).json({ ok: false, message: "Not authenticated" });
  try {
    const { target_id, value } = req.body;
    if (!isValidRecordId(target_id)) {
      return res.status(400).json({ ok: false, message: "Invalid answer id" });
    }
    const token = req.cookies?.twistask_auth;
    await Database.functions.sendContent("comment", {
      author: res.locals.user.id,
      target_id,
      value,
    }, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err); // lets Express error middleware handle/log and return a 500
  }
});

export default router;
