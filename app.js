import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";

import indexRouter from "./routes/index.js";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import challengeRouter from "./routes/challenge.js";
import timeTrialRouter from "./routes/timeTrial.js";
import reviewRouter from "./routes/review.js";
import editorRouter from "./routes/editor.js";
import adminRouter from "./routes/admin.js";

let app = express();

import { fileURLToPath } from "url";
import { dirname } from "path";
import { checkAuthStatus } from "./middleware/checkAuthStatus.js";
import { pingDatabase } from "./middleware/pingDatabase.js";
import { translate, dictionaries } from "./tools/i18n.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// In-memory cache for DB health checks to avoid hitting the DB on every request
const DB_PING_CACHE_MS = Number(process.env.DB_PING_CACHE_MS) || 5000;
let _lastDbPing = { timestamp: 0, result: null };

app.use(async (req, res, next) => {
  // Existing static assets never reach here at all - express.static above
  // already serves them directly. This only matters for requests to
  // static-looking paths that *don't* exist on disk (typos, stale
  // references); skip the DB ping for those too rather than pinging just
  // to 404 anyway. "/public/" never matched anything real: the static
  // middleware serves from the public/ directory at the URL root (e.g.
  // /stylesheets/x.css), not under a "/public" prefix.
  if (req.path === "/favicon.ico" || /^\/(stylesheets|javascripts|images|src)\//.test(req.path)) return next();

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
  res.locals.users = [];
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

// Attach translation helpers to res.locals for views/route handlers.
// Server-rendered text uses the signed-in user's saved language
// preference - it's the only language signal the server can see, since a
// guest's choice lives only in sessionStorage and never reaches it. The
// client-side counterpart (public/javascripts/utils/i18n.js) reconciles
// this against sessionStorage on every page load and on
// "app:languagechange", the same two-step pattern already used for
// content filtering (see tasksDirectory.js, home.js).
app.use((req, res, next) => {
  const lang = res.locals.user?.language || "en";
  res.locals.t = (key, vars) => translate(lang, key, vars);
  res.locals.i18n = dictionaries;
  return next();
});

app.use("/", indexRouter);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/challenge", challengeRouter);
app.use("/timeTrial", timeTrialRouter);
app.use("/review", reviewRouter);
app.use("/editor", editorRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("service/error");
});

export default app;
