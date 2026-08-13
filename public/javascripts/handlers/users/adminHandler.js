const ROLE_LABELS = { student: "Student", teacher: "Teacher", admin: "Admin" };

const buildActionsRow = (children) => {
    const row = document.createElement("div");
    row.className = "admin-item-actions";
    row.append(...children);
    return row;
};

const buildTaskCard = (task) => {
    const card = document.createElement("div");
    card.className = "task-card admin-item";

    const title = document.createElement("span");
    title.className = "task-card-title";
    // textContent, not innerHTML: task titles are user-authored content
    // and must never be parsed as markup.
    title.textContent = task.title;

    const viewLink = document.createElement("a");
    viewLink.href = `/tasks/${task.id}`;
    viewLink.textContent = "View";

    const editLink = document.createElement("a");
    editLink.href = `/editor?task=${task.id}`;
    editLink.textContent = "Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => AdminPanel.deleteTask(task.id, task.title));

    card.append(title, buildActionsRow([viewLink, editLink, deleteBtn]));
    return card;
};

const buildUserCard = (targetUser, currentUserId) => {
    const card = document.createElement("div");
    card.className = "task-card admin-item";
    const isSelf = targetUser.id === currentUserId;

    const title = document.createElement("span");
    title.className = "task-card-title";
    title.textContent = isSelf ? `${targetUser.name} (you)` : targetUser.name || targetUser.id;

    const meta = document.createElement("span");
    meta.className = "task-card-cta";
    meta.textContent = targetUser.email || "";

    const roleSelect = document.createElement("select");
    roleSelect.dataset.previousValue = targetUser.role;
    for (const [value, label] of Object.entries(ROLE_LABELS)) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        if (value === targetUser.role) opt.selected = true;
        roleSelect.appendChild(opt);
    }
    roleSelect.disabled = isSelf;
    roleSelect.addEventListener("change", () => AdminPanel.changeRole(targetUser.id, roleSelect));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.disabled = isSelf;
    deleteBtn.addEventListener("click", () => AdminPanel.deleteUser(targetUser.id, targetUser.name));

    card.append(title, meta, buildActionsRow([roleSelect, deleteBtn]));
    return card;
};

export const AdminPanel = {
    setup: () => {
        const { tasks = [], users = [], user = {} } = window.APP || {};
        const { usersError = false } = window.ADMIN || {};

        const taskStats = document.getElementById("admin-task-stats");
        const taskList = document.getElementById("admin-task-list");
        if (taskStats) taskStats.textContent = tasks.length === 1 ? "1 task total" : `${tasks.length} tasks total`;
        if (taskList) {
            if (tasks.length === 0) {
                taskList.textContent = "No tasks have been created yet.";
            } else {
                const grid = document.createElement("div");
                grid.className = "task-grid";
                for (const task of tasks) grid.appendChild(buildTaskCard(task));
                taskList.appendChild(grid);
            }
        }

        const userStats = document.getElementById("admin-user-stats");
        const userList = document.getElementById("admin-user-list");
        if (usersError) {
            if (userList) {
                userList.textContent =
                    "Couldn't load the user list - your account may not have permission to list users in the database.";
            }
            return;
        }
        if (userStats) userStats.textContent = users.length === 1 ? "1 user total" : `${users.length} users total`;
        if (userList) {
            if (users.length === 0) {
                userList.textContent = "No users found.";
            } else {
                // PocketBase's default "users" collection List API rule
                // scopes results to the caller's own record - this app
                // has no way to tell that apart from "there really is
                // only one account", so flag the ambiguous case instead
                // of silently claiming the system has just one user.
                if (users.length === 1 && users[0].id === user.id) {
                    const note = document.createElement("p");
                    note.textContent =
                        'Only your own account is visible. If other accounts exist, your PocketBase "users" collection List API rule likely needs to allow the admin role, not just @request.auth.id = id.';
                    userList.appendChild(note);
                }
                const grid = document.createElement("div");
                grid.className = "task-grid";
                for (const u of users) grid.appendChild(buildUserCard(u, user.id));
                userList.appendChild(grid);
            }
        }
    },
    deleteTask: async (id, title) => {
        const confirmed = confirm(
            `Delete "${title}"? All of its submitted answers and reviews will be permanently deleted too. This cannot be undone.`,
        );
        if (!confirmed) return;
        try {
            const res = await fetch("/editor/delete", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                console.error("Delete task failed", res.status);
                alert("Failed to delete the task. Please try again.");
                return;
            }
            window.location.reload();
        } catch (err) {
            console.error("Delete task error", err);
            alert("Network error while deleting the task.");
        }
    },
    // PocketBase's default "users" collection API rules typically scope
    // view/update/delete to the record's own owner (@request.auth.id =
    // id), same as the List rule the note above already accounts for.
    // Unlike "tasks" (confirmed working for cross-user admin edits/
    // deletes against the live database), a 403/404 here almost always
    // means that rule hasn't been opened up for the admin role yet,
    // rather than a real client/server bug - say so instead of just
    // "try again", which won't help.
    describeUserActionFailure: (status) => {
        if (status === 403 || status === 404) {
            return "Failed - your PocketBase \"users\" collection rules likely restrict this to each account's own owner. Update the View/Update/Delete rules to also allow the admin role.";
        }
        return "Failed. Please try again.";
    },
    deleteUser: async (id, name) => {
        const confirmed = confirm(
            `Delete the account "${name}"? All of their tasks, answers, and reviews will be permanently deleted too. This cannot be undone.`,
        );
        if (!confirmed) return;
        try {
            const res = await fetch(`/admin/users/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                console.error("Delete user failed", res.status);
                alert(AdminPanel.describeUserActionFailure(res.status));
                return;
            }
            window.location.reload();
        } catch (err) {
            console.error("Delete user error", err);
            alert("Network error while deleting the account.");
        }
    },
    changeRole: async (id, selectEl) => {
        const role = selectEl.value;
        const previous = selectEl.dataset.previousValue;
        selectEl.disabled = true;
        try {
            const res = await fetch(`/admin/users/${id}/role`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role }),
            });
            if (!res.ok) {
                console.error("Role change failed", res.status);
                alert(AdminPanel.describeUserActionFailure(res.status));
                selectEl.value = previous;
                return;
            }
            selectEl.dataset.previousValue = role;
        } catch (err) {
            console.error("Role change error", err);
            alert("Network error while changing the user's role.");
            selectEl.value = previous;
        } finally {
            selectEl.disabled = false;
        }
    },
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        AdminPanel.setup();
    } catch (err) {
        console.error("Failed to load admin panel:", err);
        const taskList = document.getElementById("admin-task-list");
        if (taskList) taskList.textContent = "Something went wrong loading this page. Please refresh and try again.";
    }
});
