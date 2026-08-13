import "dotenv/config";
import PocketBase from "pocketbase";

const DB_CONN = process.env.DB_CONN;
if (!DB_CONN) {
  console.error("DB_CONN is not set - database calls will fail until it is configured.");
}

// Shared client for operations that are not scoped to a specific
// authenticated user (anonymous reads, admin-less collection writes).
const connection = new PocketBase(DB_CONN);
connection.autoCancellation(false);

// PocketBase's authStore lives on the Client instance, and authRefresh()/
// the request Authorization header are derived from *that instance's*
// authStore - not from any token passed as an argument. Reusing a single
// module-level client across every request (as this file used to) means
// one request's login could populate the shared authStore and a
// concurrent request's authRefresh() would silently authenticate as that
// other user. Every call that must act as a specific user's session gets
// its own short-lived client instead, so auth state never leaks between
// requests.
const clientForToken = (token) => {
  const client = new PocketBase(DB_CONN);
  client.autoCancellation(false);
  if (token) client.authStore.save(token, null);
  return client;
};

// Explicit field whitelists so a crafted request body can't smuggle extra
// fields (role, verified, id, ...) into a create/update call - only the
// fields the corresponding form actually submits are forwarded.
//
// REGISTER_FIELDS includes "role" because the registration form lets a new
// user pick student/teacher for themselves. SETTINGS_FIELDS is deliberately
// a *separate*, narrower list for the self-service /users/settings update -
// it must never include "role" or "email", otherwise any authenticated
// user could POST {"role":"teacher"} and grant themselves teacher-only
// access (this was possible before this list was split out). It includes
// "oldPassword" because PocketBase's auth collection requires and verifies
// that field when a non-superuser changes their own password via a normal
// record update - dropping it (as the old shared list did) made every
// password change fail.
const REGISTER_FIELDS = ["email", "password", "passwordConfirm", "name", "role", "language"];
const SETTINGS_FIELDS = ["oldPassword", "password", "passwordConfirm", "language"];
const TASK_FIELDS = ["title", "description", "author", "language"];

const pick = (source, keys) => {
  const result = {};
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      result[key] = source[key];
    }
  }
  return result;
};

const Database = {
  connection,
  functions: {
    loadContent: async (type) => {
      return await connection.collection(type).getFullList();
    },

    loadContentbyUser: async (type, id) => {
      return await connection.collection(type).getFullList({
        filter: connection.filter("author = {:id}", { id }),
      });
    },

    getContent: async (type, id) => {
      return await connection.collection(`${type}s`).getOne(id);
    },

    sendContent: async (type, body, token) => {
      const client = clientForToken(token);
      return await client.collection(`${type}s`).create(body);
    },

    createTask: async (body, token) => {
      const client = clientForToken(token);
      return await client.collection("tasks").create(pick(body, TASK_FIELDS));
    },

    updateTask: async (id, body, token) => {
      const client = clientForToken(token);
      return await client.collection("tasks").update(id, pick(body, TASK_FIELDS));
    },

    getAnswersForTask: async (id) => {
      return await connection.collection("answers").getFullList({
        filter: connection.filter("target_id = {:id}", { id }),
      });
    },

    getCommentsForAnswer: async (id) => {
      return await connection.collection("comments").getFullList({
        filter: connection.filter("target_id = {:id}", { id }),
      });
    },

    deleteTask: async (id, token) => {
      const client = clientForToken(token);
      const batch = client.createBatch();
      const answerList = await client.collection("answers").getFullList({
        filter: client.filter("target_id = {:id}", { id }),
      });
      for (const ans of answerList) {
        const commentList = await client.collection("comments").getFullList({
          filter: client.filter("target_id = {:id}", { id: ans.id }),
        });
        for (const comm of commentList) {
          batch.collection("comments").delete(comm.id);
        }
        batch.collection("answers").delete(ans.id);
      }
      batch.collection("tasks").delete(id);
      return await batch.send();
    },

    createUser: async (body) => {
      const user = await connection.collection("users").create(pick(body, REGISTER_FIELDS));
      if (user && body.email) await connection.collection("users").requestVerification(body.email);
      return user;
    },

    verifyUser: async (token) => {
      return await connection.collection("users").confirmVerification(token);
    },

    deleteUser: async (id, token) => {
      const client = clientForToken(token);
      const batch = client.createBatch();
      const answerList = await client.collection("answers").getFullList({
        filter: client.filter("author = {:id}", { id }),
      });
      const commentList = await client.collection("comments").getFullList({
        filter: client.filter("author = {:id}", { id }),
      });
      const tasksList = await client.collection("tasks").getFullList({
        filter: client.filter("author = {:id}", { id }),
      });
      for (const ans of answerList) {
        batch.collection("answers").delete(ans.id);
      }
      for (const comm of commentList) {
        batch.collection("comments").delete(comm.id);
      }
      for (const task of tasksList) {
        await Database.functions.deleteTask(task.id, token);
      }
      batch.collection("users").delete(id);
      return await batch.send();
    },

    loginUser: async (username, pass) => {
      // Ephemeral client: never populate the shared connection's authStore
      // with a caller's session.
      const client = clientForToken(null);
      return await client.collection("users").authWithPassword(username, pass);
    },

    logoutUser: async () => {
      // PocketBase auth tokens are stateless JWTs - there is no server-side
      // session here to invalidate. The route layer clears the client's
      // cookie; nothing on the shared connection holds this user's state.
      return true;
    },

    requestPasswordReset: async (email) => {
      return await connection.collection("users").requestPasswordReset(email);
    },

    resetPassword: async (token, pw) => {
      return await connection.collection("users").confirmPasswordReset(
          token,
          pw,
          pw,
      );
    },

    getUserFromToken: async (token) => {
      if (!token || typeof token !== "string") return false;
      try {
        const client = clientForToken(token);
        return await client.collection("users").authRefresh();
      } catch (err) {
        if (err?.status === 401) return false;
        throw err;
      }
    },

    getUserbyId: async (id) => {
      try {
        return await connection.collection("users").getOne(id);
      } catch (err) {
        console.error("getUserbyId failed:", err?.message ?? err);
        return null;
      }
    },

    updateUser: async (id, body, token) => {
      const client = clientForToken(token);
      return await client.collection("users").update(id, pick(body, SETTINGS_FIELDS));
    },

    // Admin-only: lists every account. Uses the caller's own token (not
    // the shared anonymous `connection`) since PocketBase's "users"
    // collection list rule needs to recognize the admin role to permit
    // this at all.
    loadUsers: async (token) => {
      const client = clientForToken(token);
      return await client.collection("users").getFullList();
    },

    // Admin-only: changes another account's role. Deliberately a
    // separate function from updateUser/SETTINGS_FIELDS above - that
    // whitelist exists specifically to keep "role" out of the
    // self-service settings path, so reusing it here would defeat the
    // purpose. Only ever call this from an admin-gated route.
    updateUserRole: async (id, role, token) => {
      const client = clientForToken(token);
      return await client.collection("users").update(id, { role });
    },
  },
};

export default Database;
