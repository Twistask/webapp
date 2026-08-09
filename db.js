import "dotenv/config";
import PocketBase from "pocketbase";

const Database = {
  connection: new PocketBase(process.env.DB_CONN),
  functions: {
    loadContent: async (type) => {
      return await Database.connection.collection(type).getFullList();
    },

    loadContentbyUser: async (type, id) => {
      return await Database.connection.collection(type).getFullList({
        filter: `author = '${id}'`,
      });
    },

    getContent: async (type, id) => {
      return await Database.connection.collection(`${type}s`).getOne(id);
    },

    sendContent: async (type, body) => {
      return await Database.connection.collection(`${type}s`).create(body);
    },

    createTask: async (body) => {
      return await Database.connection.collection("tasks").create(body);
    },

    updateTask: async (id, body) => {
      return await Database.connection.collection("tasks").update(id, body);
    },

    getAnswersForTask: async (id) => {
      return await Database.connection
          .collection("answers")
          .getFullList({
            filter: `target_id = '${id}'`,
          });
    },

    getCommentsForAnswer: async (id) => {
      return await Database.connection
          .collection("comments")
          .getFullList({
            filter: `target_id = '${id}'`,
          });
    },

    deleteTask: async (id) => {
      const batch = Database.connection.createBatch();
      const answerList = await Database.connection
        .collection("answers")
        .getFullList({
          filter: `target_id = '${id}'`,
        });
      for (const ans of answerList) {
        const commentList = await Database.connection
          .collection("comments")
          .getFullList({
            filter: `target_id = '${ans.id}'`,
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
      for (const ans of answerList) {
        batch.collection("answers").delete(ans.id);
      }
      for (const comm of commentList) {
        batch.collection("comments").delete(comm.id);
      }
      for (const task of tasksList) {
        await Database.functions.deleteTask(task.id);
      }
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
      try {
        return await Database.connection.collection("users").authRefresh(token);
      } catch (err) {
        if (err.status === 401) return false;
      }
    },
    changePassword: async (id, body) => {
      return await Database.connection.collection("users").update(id, body);
    }
  },
};

Database.connection.autoCancellation(false);

export default Database;
