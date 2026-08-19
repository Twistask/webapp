import { t } from "../../utils/i18n.js";

document.addEventListener('DOMContentLoaded', () => {
    const deleteBtn = document.getElementById("delete_account");
    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", async () => {
        const confirmed = confirm(t('settings.deleteConfirm'));
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
                alert(t('settings.deleteFailed'));
                return;
            }

            window.location.replace("/");
        } catch (err) {
            console.error("Account deletion error", err);
            alert(t('settings.deleteNetworkError'));
        } finally {
            deleteBtn.disabled = false;
        }
    });
});
