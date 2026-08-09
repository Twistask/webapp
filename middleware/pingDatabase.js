import Database from "../tools/db.js";

export const pingDatabase = async () => {
    return await fetch(`${process.env.DB_CONN}/api/health`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });
}