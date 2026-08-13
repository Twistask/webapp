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
const authRateLimit = ({ windowMs, max, message, view, localsKey }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.locals[localsKey] = message;
      res.status(429).render(view);
    },
  });

export const loginLimiter = authRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in a few minutes.",
  view: "auth/login",
  localsKey: "err",
});

export const registerLimiter = authRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many registration attempts. Please try again later.",
  view: "auth/register",
  localsKey: "err",
});

export const forgotPasswordLimiter = authRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Please try again later.",
  view: "auth/verify",
  localsKey: "msg",
});

export const resetPasswordLimiter = authRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts. Please try again later.",
  view: "auth/verify",
  localsKey: "msg",
});

export const verifyLimiter = authRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many verification attempts. Please try again later.",
  view: "auth/verify",
  localsKey: "msg",
});
