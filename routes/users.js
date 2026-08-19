import express from "express";
import Database from "../tools/db.js";

let router = express.Router();

router.get("/profile", async function (req, res, next) {
  if (!res.locals.auth) return res.redirect("login");
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");
    res.locals.answers = await Database.functions.loadContent("answers");
    res.locals.comments = await Database.functions.loadContent("comments");

    res.render("profile");
  } catch (err) {
    next(err);
  }
});

router.get("/settings", function (req, res, next) {
  if (!res.locals.auth) return res.redirect("login");
  res.locals.err = "";
  res.render("settings");
});

router.delete("/delete", async function (req, res, next) {
  if (!res.locals.auth) return res.status(403).json({ ok: false, message: "Not authenticated" });
  try {
    const token = req.cookies?.twistask_auth;
    await Database.functions.deleteUser(res.locals.user.id, token);
    res.clearCookie("twistask_auth", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/settings", async function (req, res, next) {
  if (!res.locals.auth) return res.status(403).json({ ok: false, message: "Not authenticated" });
  const body = req.body;
  try {
    const token = req.cookies?.twistask_auth;
    await Database.functions.updateUser(res.locals.user.id, body, token);
    if (req.body.password) {
      res.clearCookie("twistask_auth", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }
    return res.redirect(303, "/");
  } catch (err) {
    res.locals.err = res.locals.t('settings.changePasswordFailed');
    return res.render("settings");
  }
});

export default router;
