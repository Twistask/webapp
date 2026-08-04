document.getElementById("delete_account").addEventListener("click", async () => {
    let answer = confirm("THIS ACTION IS IRREVERSIBLE!!! All your tasks, answers and reviews will be permanently deleted! Are you sure?");
    if (answer === true) {
        const res = await fetch('/users/delete', {
            method: 'DELETE',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
        });
        window.location.href = "/";
    }
});

document.getElementById("submit_pw").addEventListener("click", async () => {
    const res = await fetch('/users/changePW', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
    });
    window.location.href = "/";
});