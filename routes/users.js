import express from "express";
import Database from "../db.js";

let router = express.Router();
/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.get("/register", function (req, res, next) {
  res.render("register", { title: "Twistask" });
});

router.post("/register/submit", async (req, res, next) => {
  try {
    const body = req.body;
    const result = await Database.functions.createUser(body);
    res.status(201).json({ ok: true, user: result.user ?? null });
  } catch (err) {
    next(err);
  }
});

router.get("/login", function (req, res, next) {
  res.render("login", { title: "Twistask" });
});

router.post("/login/submit", async (req, res, next) => {
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

    res.json({ authenticated: true, user: result.user ?? null });
  } catch (err) {
    next(err);
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

router.get("/profile", function (req, res, next) {
  res.render("profile", { title: "Twistask" });
});

router.delete("/delete", async function (req, res, next) {
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
    res.clearCookie("twistask_auth", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    await Database.functions.deleteUser(user.record.id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/changePW", function (req, res, next) {
  res.render("profile", { title: "Twistask" });
});

export default router;
