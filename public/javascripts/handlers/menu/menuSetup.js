const { user = {} } = window.APP || {};

let setupLanguageSelect = () => {
  const lngSelect = document.getElementById("language-select");
  if (!lngSelect) return;

  // getItem() returns null (not "") when nothing is stored yet - the old
  // `!== ""` check treated that as "already stored" and assigned the
  // literal string "null" to .value, which matches no <option> and left
  // the select blank instead of showing the default language.
  const stored = sessionStorage.getItem("language");
  if (stored) lngSelect.value = stored;
  else sessionStorage.setItem("language", lngSelect.value);

  lngSelect.addEventListener('change', async (ev) => {
    sessionStorage.setItem("language", lngSelect.value);
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
