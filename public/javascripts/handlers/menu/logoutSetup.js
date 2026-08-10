let setupLogout = () => {
  if (document.getElementById("logout"))
    document.getElementById("logout").addEventListener("click", async (ev) => {
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
          // show a simple message — replace with nicer UI as needed
          alert("Logout failed. Please try again.");
        }
        window.location.href = "/";
      } catch (err) {
        console.error("Logout error", err);
        alert("Network error while logging out.");
      }
    });
};

setupLogout();
