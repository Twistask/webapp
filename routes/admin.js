import express from "express";
import Database from "../tools/db.js";
import { isValidRecordId } from "./utils/validateId.js";
let router = express.Router();

const VALID_ROLES = ["student", "teacher", "admin"];

const requireAdmin = (req, res, next) => {
  // res.locals.user is null for anonymous visitors (see app.js's default
  // locals) - checking .role on it directly throws instead of redirecting.
  //
  // Absolute paths, not relative ones: this middleware runs for routes
  // at different nesting depths under /admin (/, /users/:id, /users/:id
  // /role), and a relative "../" resolves differently depending on which
  // one triggered it - only correct by accident for the shallowest
  // route. Also: the login page actually lives at /auth/login, not
  // /users/login (a bug that turned out to be site-wide - see the other
  // routes fixed alongside this one).
  if (!res.locals.auth) return res.redirect("/auth/login");
  if (res.locals.user.role !== "admin") return res.redirect("/");
  next();
};

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    res.locals.tasks = await Database.functions.loadContent("tasks");

    // Best-effort: if the "users" collection's list rule doesn't
    // recognize the admin role, don't let that take down the whole
    // panel - just show the tasks section without users instead.
    // usersError must be set on both branches (EJS throws a
    // ReferenceError for a local that's merely unset, not just falsy -
    // the same issue res.locals.users itself had before it got a default
    // in app.js).
    try {
      const token = req.cookies?.twistask_auth;
      res.locals.users = await Database.functions.loadUsers(token);
      res.locals.usersError = false;
    } catch (err) {
      console.error("Admin panel: failed to load users:", err?.message ?? err);
      res.locals.users = [];
      res.locals.usersError = true;
    }

    res.render("admin/dashboard");
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", requireAdmin, async (req, res, next) => {
  const id = req.params.id;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ ok: false, message: "Invalid user id" });
  }
  // Deleting your own account here would silently sign you out mid-
  // session with no confirmation UX built for that - Settings already
  // has a dedicated, confirmed flow for self-deletion.
  if (id === res.locals.user.id) {
    return res.status(400).json({ ok: false, message: "Use Settings to delete your own account" });
  }
  try {
    const token = req.cookies?.twistask_auth;
    await Database.functions.deleteUser(id, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/users/:id/role", requireAdmin, async (req, res, next) => {
  const id = req.params.id;
  if (!isValidRecordId(id)) {
    return res.status(400).json({ ok: false, message: "Invalid user id" });
  }
  const { role } = req.body;
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ ok: false, message: "Invalid role" });
  }
  // Blocks self-demotion/self-promotion here for the same reason as
  // self-delete above - an admin locking themselves out with no other
  // admin account to fix it is not a mistake we should make easy.
  if (id === res.locals.user.id) {
    return res.status(400).json({ ok: false, message: "You cannot change your own role" });
  }
  try {
    const token = req.cookies?.twistask_auth;
    await Database.functions.updateUserRole(id, role, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
