document
  .getElementById("delete_account")
  .addEventListener("click", async () => {
    let answer = confirm(
      "THIS ACTION IS IRREVERSIBLE!!! All your tasks, answers and reviews will be permanently deleted! Are you sure?",
    );
    if (answer === true) {
      await fetch("/users/delete", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = "/";
    }
  });
