import rateLimit from "express-rate-limit";

// Auth endpoints are prime targets for credential stuffing, registration/
// email-bombing spam, and token brute-forcing. Each limiter below rejects
// with the same template its route would normally render, so a throttled
// request still gets the app's usual page instead of a bare JSON error.
//
// Note: express-rate-limit keys on req.ip by default. If this app is ever
// deployed behind a reverse proxy/load balancer, `app.set('trust proxy', ...)`
// must be configured correctly (to the real number of hops) or every
// request will appear to come from the proxy's IP and share one bucket.
const authRateLimit = ({ windowMs, max, messageKey, view, localsKey }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // res.locals.t is set by app.js's i18n middleware, which runs
      // before this route-level middleware for every request.
      res.locals[localsKey] = res.locals.t(messageKey);
      res.status(429).render(view);
    },
  });

export const loginLimiter = authRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  messageKey: "auth.rateLimit.login",
  view: "auth/login",
  localsKey: "err",
});

export const registerLimiter = authRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  messageKey: "auth.rateLimit.register",
  view: "auth/register",
  localsKey: "err",
});

export const forgotPasswordLimiter = authRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  messageKey: "auth.rateLimit.forgotPassword",
  view: "auth/verify",
  localsKey: "msg",
});

export const resetPasswordLimiter = authRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  messageKey: "auth.rateLimit.resetPassword",
  view: "auth/verify",
  localsKey: "msg",
});

export const verifyLimiter = authRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  messageKey: "auth.rateLimit.verify",
  view: "auth/verify",
  localsKey: "msg",
});
