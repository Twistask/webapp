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
import {pingDatabase} from "./middleware/pingDatabase.js";

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

app.use(async (req, res, next) => {
  try {
    let result = await pingDatabase();
    if (result.status === 200) return next();
  } catch (err) {
    console.log("Database is offline!!!");
    res.render("service/maintenance");
  }
})

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
  next();
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

  // render the error page
  res.status(err.status || 500);
  res.render("service/error");
});

export default app;
