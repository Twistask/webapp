import Database from "../db.js";

export const checkAuthStatus = async (token) => {
  try {
    if (token && Database && Database.functions?.getUserFromToken) {
      const user = await Database.functions
        .getUserFromToken(token)
        .catch((err) => console.log(err));
      if (user && user.record) {
        let isAuthenticated = true;
        let userData = {
          id: user.record.id,
          name: user.record.name ?? user.record.email ?? "",
        };
        return { isAuthenticated, userData };
      } else {
        return { isAuthenticated: false, userData: undefined };
      }
    } else {
      return { isAuthenticated: false, userData: undefined };
    }
  } catch (err) {
    console.error("users router auth middleware error:", err);
  }
};
