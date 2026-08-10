document.addEventListener('DOMContentLoaded', () => {
    const deleteBtn = document.getElementById("delete_account");
    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", async () => {
        const confirmed = confirm(
            "THIS ACTION IS IRREVERSIBLE!!! All your tasks and associated content will be permanently deleted! Are you sure?",
        );
        if (!confirmed) return;

        deleteBtn.disabled = true;
        try {
            const res = await fetch("/users/delete", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (!res.ok) {
                console.error("Account deletion failed", res.status);
                alert("Failed to delete your account. Please try again.");
                return;
            }

            window.location.href = "/";
        } catch (err) {
            console.error("Account deletion error", err);
            alert("Network error while deleting your account. Your account was NOT deleted.");
        } finally {
            deleteBtn.disabled = false;
        }
    });
});
