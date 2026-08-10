import "dotenv/config";
import PocketBase from "pocketbase";

const DB_CONN = process.env.DB_CONN;

// Helper to escape single quotes used in PocketBase filters
const escapeFilter = (v) => String(v).replace(/'/g, "\\'");

let connection = null;
if (DB_CONN) {
  try {
    connection = new PocketBase(DB_CONN);
  } catch (err) {
    console.error("tools/db: failed to initialize PocketBase connection:", err?.message ?? err);
    connection = null;
  }
} else {
  console.warn("tools/db: DB_CONN is not set. Database functions will throw until configured.");
}

const ensureConnection = () => {
  if (!connection) throw new Error("DB_CONN not configured or PocketBase initialization failed");
  return connection;
};

const Database = {
  connection,
  functions: {
    loadContent: async (type) => {
      try {
        const conn = ensureConnection();
        return await conn.collection(type).getFullList();
      } catch (err) {
        console.error("tools/db.loadContent error:", err?.message ?? err);
        throw err;
      }
    },

    loadContentbyUser: async (type, id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        return await conn.collection(type).getFullList({
          filter: `author = '${escapeFilter(id)}'`,
        });
      } catch (err) {
        console.error("tools/db.loadContentbyUser error:", err?.message ?? err);
        throw err;
      }
    },

    getContent: async (type, id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        return await conn.collection(`${type}s`).getOne(id);
      } catch (err) {
        console.error("tools/db.getContent error:", err?.message ?? err);
        throw err;
      }
    },

    sendContent: async (type, body) => {
      try {
        const conn = ensureConnection();
        if (!body) throw new Error("missing body");
        return await conn.collection(`${type}s`).create(body);
      } catch (err) {
        console.error("tools/db.sendContent error:", err?.message ?? err);
        throw err;
      }
    },

    createTask: async (body) => {
      try {
        const conn = ensureConnection();
        if (!body) throw new Error("missing body");
        return await conn.collection("tasks").create(body);
      } catch (err) {
        console.error("tools/db.createTask error:", err?.message ?? err);
        throw err;
      }
    },

    updateTask: async (id, body) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        if (!body) throw new Error("missing body");
        return await conn.collection("tasks").update(id, body);
      } catch (err) {
        console.error("tools/db.updateTask error:", err?.message ?? err);
        throw err;
      }
    },

    getAnswersForTask: async (id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        return await conn
          .collection("answers")
          .getFullList({
            filter: `target_id = '${escapeFilter(id)}'`,
          });
      } catch (err) {
        console.error("tools/db.getAnswersForTask error:", err?.message ?? err);
        throw err;
      }
    },

    getCommentsForAnswer: async (id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        return await conn
          .collection("comments")
          .getFullList({
            filter: `target_id = '${escapeFilter(id)}'`,
          });
      } catch (err) {
        console.error("tools/db.getCommentsForAnswer error:", err?.message ?? err);
        throw err;
      }
    },

    deleteTask: async (id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        const batch = conn.createBatch();
        const answerList = await conn
          .collection("answers")
          .getFullList({
            filter: `target_id = '${escapeFilter(id)}'`,
          });
        for (const ans of answerList) {
          const commentList = await conn
            .collection("comments")
            .getFullList({
              filter: `target_id = '${escapeFilter(ans.id)}'`,
            });
          for (const comm of commentList) {
            batch.collection("comments").delete(comm.id);
          }
          batch.collection("answers").delete(ans.id);
        }
        batch.collection("tasks").delete(id);
        return await batch.send();
      } catch (err) {
        console.error("tools/db.deleteTask error:", err?.message ?? err);
        throw err;
      }
    },

    createUser: async (body) => {
      try {
        const conn = ensureConnection();
        if (!body) throw new Error("missing body");
        const user = await conn.collection("users").create(body);
        if (user && body.email) {
          try {
            await conn.collection("users").requestVerification(body.email);
          } catch (verErr) {
            console.warn("tools/db.createUser: requestVerification failed:", verErr?.message ?? verErr);
            // non-fatal: user was created even if verification request failed
          }
        }
        return user;
      } catch (err) {
        console.error("tools/db.createUser error:", err?.message ?? err);
        throw err;
      }
    },

    verifyUser: async (token) => {
      try {
        const conn = ensureConnection();
        if (!token) throw new Error("missing token");
        return await conn.collection("users").confirmVerification(token);
      } catch (err) {
        console.error("tools/db.verifyUser error:", err?.message ?? err);
        throw err;
      }
    },

    deleteUser: async (id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        const batch = conn.createBatch();
        const answerList = await conn
          .collection("answers")
          .getFullList({
            filter: `author = '${escapeFilter(id)}'`,
          });
        const commentList = await conn
          .collection("comments")
          .getFullList({
            filter: `author = '${escapeFilter(id)}'`,
          });
        const tasksList = await conn
          .collection("tasks")
          .getFullList({
            filter: `author = '${escapeFilter(id)}'`,
          });
        for (const ans of answerList) {
          batch.collection("answers").delete(ans.id);
        }
        for (const comm of commentList) {
          batch.collection("comments").delete(comm.id);
        }
        for (const task of tasksList) {
          // reuse deleteTask which will validate connection and log errors
          await Database.functions.deleteTask(task.id);
        }
        batch.collection("users").delete(id);
        return await batch.send();
      } catch (err) {
        console.error("tools/db.deleteUser error:", err?.message ?? err);
        throw err;
      }
    },

    loginUser: async (username, pass) => {
      try {
        const conn = ensureConnection();
        if (!username || !pass) throw new Error("missing credentials");
        return await conn.collection("users").authWithPassword(username, pass);
      } catch (err) {
        console.error("tools/db.loginUser error:", err?.message ?? err);
        throw err;
      }
    },

    logoutUser: async () => {
      try {
        const conn = ensureConnection();
        return conn.authStore.clear();
      } catch (err) {
        console.error("tools/db.logoutUser error:", err?.message ?? err);
        throw err;
      }
    },

    requestPasswordReset: async (email) => {
      try {
        const conn = ensureConnection();
        if (!email) throw new Error("missing email");
        return await conn.collection("users").requestPasswordReset(email);
      } catch (err) {
        console.error("tools/db.requestPasswordReset error:", err?.message ?? err);
        throw err;
      }
    },

    resetPassword: async (token, pw) => {
      try {
        const conn = ensureConnection();
        if (!token || !pw) throw new Error("missing token or password");
        return await conn.collection("users").confirmPasswordReset(token, pw, pw);
      } catch (err) {
        console.error("tools/db.resetPassword error:", err?.message ?? err);
        throw err;
      }
    },

    getUserFromToken: async (token) => {
      try {
        const conn = ensureConnection();
        if (!token) throw new Error("missing token");
        return await conn.collection("users").authRefresh(token);
      } catch (err) {
        // PocketBase authRefresh throws for invalid tokens; return false to keep previous behavior
        if (err && err.status === 401) return false;
        console.error("tools/db.getUserFromToken error:", err?.message ?? err);
        throw err;
      }
    },

    getUserbyId: async (id) => {
      try {
        const conn = ensureConnection();
        if (!id) throw new Error("missing id");
        return await conn.collection("users").getOne(id);
      } catch (e) {
        console.error("tools/db.getUserbyId error:", e?.message ?? e);
        throw e;
      }
    },

    changePassword: async (id, body) => {
      try {
        const conn = ensureConnection();
        if (!id || !body) throw new Error("missing id or body");
        return await conn.collection("users").update(id, body);
      } catch (err) {
        console.error("tools/db.changePassword error:", err?.message ?? err);
        throw err;
      }
    },
  },
};

if (connection && typeof connection.autoCancellation === "function") {
  try {
    connection.autoCancellation(false);
  } catch (e) {
    console.warn("tools/db: failed to set autoCancellation:", e?.message ?? e);
  }
}

export default Database;
