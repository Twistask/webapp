import express from "express";
import Database from "../tools/db.js";
import { isNonEmptyString } from "../utils/validate.js";

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// Registration page
router.get("/register", (req, res) => {
  if (res.locals.auth) return res.redirect("/");
  res.locals.err = "";
  return res.render("auth/register", { title: "Twistask" });
});

router.post("/register", async (req, res, next) => {
  if (res.locals.auth) return res.status(409).render("service/error", { message: "Already authenticated" });

  const body = req.body || {};
  if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
    res.locals.err = "Email and password are required";
    return res.status(400).render("auth/register");
  }

  try {
    await Database.functions.createUser(body);
    return res.redirect(303, "/");
  } catch (err) {
    console.error("users.register error:", err?.message ?? err);
    res.locals.err = "Failed to register. Please check your details.";
    return res.status(500).render("auth/register");
  }
});

// Login page
router.get("/login", (req, res) => {
  if (res.locals.auth) return res.redirect("/");
  res.locals.err = "";
  return res.render("auth/login", { title: "Twistask" });
});

router.post("/login", async (req, res, next) => {
  if (res.locals.auth) return res.status(409).render("service/error", { message: "Already authenticated" });

  const { email, password } = req.body || {};
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.locals.err = "Email and password are required";
    return res.status(400).render("auth/login");
  }

  try {
    const result = await Database.functions.loginUser(email, password);
    const token = result?.token;
    if (!isNonEmptyString(token)) {
      res.locals.err = "Authentication failed";
      return res.status(401).render("auth/login");
    }

    res.cookie("twistask_auth", token, cookieOptions);
    return res.redirect(303, "/");
  } catch (err) {
    console.error("users.login error:", err?.message ?? err);
    res.locals.err = "Failed to authenticate. Please check your username and password.";
    return res.status(401).render("auth/login");
  }
});

// Auth status (API)
router.get("/auth/status", async (req, res) => {
  try {
    const token = req.cookies?.twistask_auth;
    if (!token) return res.json({ authenticated: false });
    const user = await Database.functions.getUserFromToken(token).catch(() => false);
    if (!user) return res.json({ authenticated: false });

    return res.status(200).json({ authenticated: true, user: { id: user.record?.id, email: user.record?.email, role: user.record?.role } });
  } catch (err) {
    return res.status(500).json({ authenticated: false });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  if (!res.locals.auth) return res.status(401).json({ ok: false, error: "not authenticated" });

  try {
    await Database.functions.logoutUser().catch((e) => console.warn("logoutUser failed:", e));
  } finally {
    res.clearCookie("twistask_auth", cookieOptions);
    return res.status(200).json({ ok: true });
  }
});

// Profile view
router.get("/profile", async (req, res, next) => {
  if (!res.locals.auth) return res.redirect("/users/login");

  try {
    const tasks = await Database.functions.loadContent("tasks");
    const answers = await Database.functions.loadContent("answers");
    const comments = await Database.functions.loadContent("comments");
    return res.render("profile", { title: "Twistask", tasks, answers, comments });
  } catch (err) {
    return next(err);
  }
});

// Settings page
router.get("/settings", (req, res) => {
  if (!res.locals.auth) return res.redirect("/users/login");
  res.locals.err = "";
  return res.render("settings");
});

// Change password (settings)
router.post("/settings", async (req, res, next) => {
  if (!res.locals.auth) return res.status(401).render("settings");
  const body = req.body || {};
  try {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(401).json({ authenticated: false });

    await Database.functions.changePassword(userId, body);
    res.clearCookie("twistask_auth", cookieOptions);
    return res.redirect(303, "/");
  } catch (err) {
    console.error("users.changePassword error:", err?.message ?? err);
    res.locals.err = "Failed to change password. Please check input.";
    return res.status(500).render("settings");
  }
});

// Delete account
router.delete("/delete", async (req, res, next) => {
  if (!res.locals.auth) return res.status(401).json({ authenticated: false });

  try {
    const userId = res.locals.user?.id;
    if (!userId) return res.status(400).json({ ok: false, error: "no user id" });

    await Database.functions.deleteUser(userId);
    res.clearCookie("twistask_auth", cookieOptions);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// Verification and password reset flows
router.get("/verify", async (req, res) => {
  const token = String(req.query.token || "").trim();
  if (!token) {
    res.locals.msg = "Missing verification token.";
    return res.render("auth/verify");
  }

  try {
    const result = await Database.functions.verifyUser(token);
    if (result === true) {
      res.locals.msg = "Successfully verified your account.";
      return res.render("auth/verify");
    }
    res.locals.msg = "Verification failed.";
    return res.render("auth/verify");
  } catch (err) {
    res.locals.msg = "Invalid or expired verification token.";
    return res.render("auth/verify");
  }
});

router.get("/forgot-password", (req, res) => {
  if (res.locals.auth) return res.redirect("/");
  res.locals.err = "";
  return res.render("auth/request-password-reset", { title: "Twistask" });
});

router.post("/forgot-password", async (req, res) => {
  if (res.locals.auth) return res.status(409).render("service/error", { message: "Already authenticated" });
  const email = String(req.body?.email || "").trim();
  if (!isNonEmptyString(email)) {
    res.locals.msg = "Email is required.";
    return res.render("auth/verify");
  }
  try {
    const result = await Database.functions.requestPasswordReset(email);
    if (result === true) {
      res.locals.msg = "Check your email for instructions.";
      return res.render("auth/verify");
    }
    res.locals.msg = "Unable to send reset email.";
    return res.render("auth/verify");
  } catch (err) {
    res.locals.msg = "Invalid account.";
    return res.render("auth/verify");
  }
});

router.get("/reset-password", (req, res) => {
  const token = String(req.query.token || "").trim();
  if (res.locals.auth || !token) return res.redirect("/");
  res.locals.token = token;
  return res.render("auth/reset-password", { title: "Twistask" });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body || {};
  if (!isNonEmptyString(token) || !isNonEmptyString(password)) {
    res.locals.msg = "Token and password are required.";
    return res.render("auth/verify");
  }
  try {
    const result = await Database.functions.resetPassword(token, password);
    if (result === true) {
      res.locals.msg = "Successfully reset your password.";
      return res.render("auth/verify");
    }
    res.locals.msg = "Invalid or expired token.";
    return res.render("auth/verify");
  } catch (err) {
    res.locals.msg = "Invalid or expired token.";
    return res.render("auth/verify");
  }
});

export default router;
