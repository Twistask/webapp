export const requireRole = (allowedRoles) => (req, res, next) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const role = res.locals.user?.role ?? null;
  if (!role || !roles.includes(role)) {
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
    return res.status(403).render("service/error", { message: "forbidden" });
  }
  return next();
};
