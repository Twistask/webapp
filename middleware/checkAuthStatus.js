import Database from "../tools/db.js";

const DEFAULT_AUTH_RESULT = { isAuthenticated: false, userData: undefined };

/**
 * Checks whether a token corresponds to an authenticated user.
 * Always returns an object of the form: { isAuthenticated: boolean, userData: object | undefined }
 * This function never throws; on error it returns the default unauthenticated result.
 */
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
        },
      };
    }

    return DEFAULT_AUTH_RESULT;
  } catch (err) {
    // log and return a safe default
    console.error("checkAuthStatus error:", err?.message ?? err);
    return DEFAULT_AUTH_RESULT;
  }
};
