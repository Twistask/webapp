const { user = {} } = window.APP || {};

let setupLanguageSelect = () => {
  const lngSelect = document.getElementById("language-select");
  if (!lngSelect) return;

  lngSelect.addEventListener('change', async (ev) => {
    user.current_language = lngSelect.value;
    console.log(user);
  })
}


let setupLogout = () => {
  const logoutBtn = document.getElementById("logout");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async (ev) => {
    try {
      const res = await fetch("/auth/logout", {
        method: "POST", // use POST to match your route
        credentials: "include", // send HttpOnly cookie
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        console.error("Logout failed", res.status);
        alert("Logout failed. Please try again.");
        return;
      }
      window.location.replace("/");
    } catch (err) {
      console.error("Logout error", err);
      alert("Network error while logging out.");
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  setupLanguageSelect();
  setupLogout();
});
