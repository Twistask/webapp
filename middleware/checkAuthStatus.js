import Database from "../tools/db.js";

const DEFAULT_AUTH_RESULT = { isAuthenticated: false, userData: undefined };

export const checkAuthStatus = async (token) => {
  // basic validation
  if (!token || typeof token !== "string") return DEFAULT_AUTH_RESULT;

  // ensure Database and the helper function are available
  if (!Database || typeof Database.functions?.getUserFromToken !== "function") {
    console.warn("checkAuthStatus: Database.functions.getUserFromToken is not available");
    return DEFAULT_AUTH_RESULT;
  }

  try {
    const user = await Database.functions.getUserFromToken(token);

    if (user && user.record) {
      return {
        isAuthenticated: true,
        userData: {
          id: user.record.id,
          name: user.record.name ?? user.record.email ?? "",
          role: user.record.role ?? null,
          language: user.record.language,
          current_language: user.record.language,
        },
      };
    }

    return DEFAULT_AUTH_RESULT;
  } catch (err) {
    console.error("checkAuthStatus error:", err?.message ?? err);
    return DEFAULT_AUTH_RESULT;
  }
};