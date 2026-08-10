export const requireAuthRedirect = (req, res, next) => {
  if (!res.locals.auth) return res.redirect("/users/login");
  return next();
};

export const requireAuthJson = (req, res, next) => {
  if (!res.locals.auth) return res.status(401).json({ authenticated: false });
  return next();
};
