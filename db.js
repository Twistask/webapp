import 'dotenv/config'
import PocketBase from 'pocketbase';

const Database = {
    connection: new PocketBase(process.env.DB_CONN),
    functions: {
        loadContent: async (type) => {
            return await Database.connection.collection(type).getFullList()
        },

        sendContent: async (type, body) => {
            return await Database.connection.collection(`${type}s`).create(body);
        },

        createTask: async (body) => {
            await Database.connection.collection('tasks').create(body);
        },

        createUser: async (body) => {
            await Database.connection.collection('users').create(body);
        },

        loginUser: async (username, pass) => {
            return await Database.connection.collection('users').authWithPassword(
                username,
                pass,
            );
        },

        logoutUser: async () => {
            await Database.connection.authStore.clear();
        },
        async getUserFromToken(token) {
           return await Database.connection.collection('users').authRefresh(token)
        }
    }
}

Database.connection.autoCancellation(false);

export default Database;