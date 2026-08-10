import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";
import challengeRouter from "./routes/challenge.js";
import timeTrialRouter from "./routes/timeTrial.js";
import reviewRouter from "./routes/review.js";
import editorRouter from "./routes/editor.js";

let app = express();

import { fileURLToPath } from "url";
import { dirname } from "path";
import { checkAuthStatus } from "./middleware/checkAuthStatus.js";
import { pingDatabase } from "./middleware/pingDatabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// In-memory cache for DB health checks to avoid hitting the DB on every request
const DB_PING_CACHE_MS = Number(process.env.DB_PING_CACHE_MS) || 5000;
let _lastDbPing = { timestamp: 0, result: null };

app.use(async (req, res, next) => {
  // skip health checks for favicon and health endpoints
  if (req.path === "/favicon.ico" || req.path.startsWith("/public/")) return next();

  try {
    const now = Date.now();
    if (_lastDbPing.result && now - _lastDbPing.timestamp < DB_PING_CACHE_MS) {
      // use cached result
      if (_lastDbPing.result.ok && _lastDbPing.result.status === 200) return next();
      console.warn("DB health (cached) not OK:", _lastDbPing.result.error ?? _lastDbPing.result.status);
      return res.status(503).render("service/maintenance");
    }

    const result = await pingDatabase();
    _lastDbPing = { timestamp: now, result };

    if (result && result.ok && result.status === 200) return next();

    console.warn("DB health check failed:", result?.error ?? `status ${result?.status}`);
    return res.status(503).render("service/maintenance");
  } catch (err) {
    console.error("Unexpected error in DB health middleware:", err?.message ?? err);
    return res.status(503).render("service/maintenance");
  }
});

// Attach auth status to res.locals for downstream handlers
app.use(async (req, res, next) => {
  res.locals.title = "Twistask";
  res.locals.mode = "none";
  res.locals.tasks = [];
  res.locals.answers = [];
  res.locals.comments = [];
  res.locals.auth = false;
  res.locals.user = null;
  try {
    const token = req.cookies?.twistask_auth;
    let status = await checkAuthStatus(token);
    res.locals.auth = status.isAuthenticated;
    res.locals.user = status.userData;
  } catch (err) {
    console.error("middleware unexpected error:", err);
    res.locals.auth = false;
    res.locals.user = null;
  }
  return next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/challenge", challengeRouter);
app.use("/timeTrial", timeTrialRouter);
app.use("/review", reviewRouter);
app.use("/editor", editorRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // respond with JSON for API clients
  const wantsJson = req.headers.accept && req.headers.accept.includes("application/json");
  const status = err.status || 500;

  if (wantsJson || req.xhr) {
    return res.status(status).json({ error: res.locals.message || "Internal Server Error", status });
  }

  // render the error page for browsers
  res.status(status);
  return res.render("service/error");
});

export default app;
