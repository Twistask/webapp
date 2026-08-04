import "dotenv/config";
import PocketBase from "pocketbase";

const Database = {
  connection: new PocketBase(process.env.DB_CONN),
  functions: {
    loadContent: async (type) => {
      return await Database.connection.collection(type).getFullList();
    },

    sendContent: async (type, body) => {
      return await Database.connection.collection(`${type}s`).create(body);
    },

    createTask: async (body) => {
      return await Database.connection.collection("tasks").create(body);
    },

    createUser: async (body) => {
      return await Database.connection.collection("users").create(body);
    },

    deleteUser: async (id) => {
      const batch = Database.connection.createBatch();
      const answerList = await Database.connection
        .collection("answers")
        .getFullList({
          filter: `author = '${id}'`,
        });
      const commentList = await Database.connection
        .collection("comments")
        .getFullList({
          filter: `author = '${id}'`,
        });
      const tasksList = await Database.connection
        .collection("tasks")
        .getFullList({
          filter: `author = '${id}'`,
        });
      answerList.forEach((ans) => {
        batch.collection("answers").delete(ans.id);
      });
      commentList.forEach((ans) => {
        batch.collection("comments").delete(ans.id);
      });
      tasksList.forEach((ans) => {
        batch.collection("tasks").delete(ans.id);
      });
      batch.collection("users").delete(id);
      await batch.send();
    },

    loginUser: async (username, pass) => {
      return await Database.connection
        .collection("users")
        .authWithPassword(username, pass);
    },

    logoutUser: async () => {
      return Database.connection.authStore.clear();
    },
    getUserFromToken: async (token) => {
      return await Database.connection.collection("users").authRefresh(token);
    },
  },
};

Database.connection.autoCancellation(false);

export default Database;
