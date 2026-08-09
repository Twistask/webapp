import express from "express";
import Database from "../db.js";

let router = express.Router();

router.get("/register", function (req, res, next) {
  if (res.locals.auth) res.redirect("../");
  res.locals.err = "";
  res.render("auth/register", { title: "Twistask" });
});

router.post("/register", async (req, res, next) => {
  if (res.locals.auth) res.status(409);
  try {
    const body = req.body;
    const result = await Database.functions.createUser(body);
    res.redirect(303, "/");
  } catch (err) {
    res.locals.err = "Failed to register. Please check if you've entered the information correctly."
    return res.render("auth/register");
  }
});

router.get("/login", function (req, res, next) {
  if (res.locals.auth) res.redirect("../");
  res.locals.err = "";
  res.render("auth/login", { title: "Twistask" });
});

router.post("/login", async (req, res, next) => {
  if (res.locals.auth) res.status(409);
  try {
    const body = req.body;
    const result = await Database.functions.loginUser(
      body.email,
      body.password,
    );
    const token = result.token;
    if (!token) {
      return res
        .status(500)
        .json({ ok: false, message: "No token returned from auth" });
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    };

    res.cookie("twistask_auth", token, cookieOptions);

    res.redirect(303, "/");
  } catch (err) {
    res.locals.err = "Failed to authenticate. Please check your username and password."
    return res.render("auth/login");
  }
});

router.get("/auth/status", async (req, res, next) => {
  try {
    const token = req.cookies?.twistask_auth;
    if (!token) {
      return res.json({ authenticated: false });
    }

    let user = null;
    try {
      user = await Database.functions.getUserFromToken(token);
    } catch (err) {
      return res.json({ authenticated: false });
    }

    if (!user) return res.json({ authenticated: false });
    res.status(200).json({ authenticated: true, user });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async function (req, res, next) {
  if (!res.locals.auth) res.redirect("../");
  try {
    const token = req.cookies?.twistask_auth;

    if (token && Database.functions.logoutUser) {
      try {
        await Database.functions.logoutUser(token);
      } catch (err) {
        console.error("logoutUser failed:", err);
      }
    }

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

router.get("/profile", async function (req, res, next) {
  if (!res.locals.auth) res.redirect("login");
  try {
    const token = req.cookies?.twistask_auth;
    if (!token) {
      return res.json({ authenticated: false });
    }

    let user = null;
    try {
      user = await Database.functions.getUserFromToken(token);
    } catch (err) {
      return res.json({ authenticated: false });
    }

    if (!user) return res.json({ authenticated: false });

    let tasks = await Database.functions.loadContent("tasks");
    let answers = await Database.functions.loadContent("answers");
    let comments = await Database.functions.loadContent("comments");

    res.render("profile", { title: "Twistask", tasks, answers, comments });
  } catch (err) {
    next(err);
  }
});

router.get("/settings", function (req, res, next) {
  if (!res.locals.auth) res.redirect("login");
  res.locals.err = "";
  res.render("settings");
});

router.delete("/delete", async function (req, res, next) {
  if (!res.locals.auth) res.status(403);
  try {
    const token = req.cookies?.twistask_auth;
    if (!token) {
      return res.json({ authenticated: false });
    }

    let user = null;
    try {
      user = await Database.functions.getUserFromToken(token);
    } catch (err) {
      return res.json({ authenticated: false });
    }

    if (!user) return res.json({ authenticated: false });
    let result = await Database.functions.deleteUser(user.record.id);
    if (result.status === 200) res.clearCookie("twistask_auth", {
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
  if (!res.locals.auth) res.status(403);
  const body = req.body;
  try {
    const token = req.cookies?.twistask_auth;
    if (!token) {
      return res.json({ authenticated: false });
    }

    let user = null;
    try {
      user = await Database.functions.getUserFromToken(token);
    } catch (err) {
      return res.json({ authenticated: false });
    }

    if (!user) return res.json({ authenticated: false });
    let result = await Database.functions.changePassword(user.record.id, body);
    if (result.status === 200) res.clearCookie("twistask_auth", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return res.redirect(303, "/");
  } catch (err) {
    res.locals.err = "Failed to change password. Please check if you've entered the information correctly."
    return res.render("settings");
  }
})

export default router;
