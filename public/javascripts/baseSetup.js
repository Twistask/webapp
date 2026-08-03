import {checkAuthStatus} from "./handlers/users/authHelper.js";

let quill = undefined;
let mode = localStorage.getItem("mode");

let setupPage = async () => {
    let auth = await checkAuthStatus();
    switch (auth.authenticated) {
        case true:
            document.getElementById("logged-out").remove();
            break;
        case false:
            document.getElementById("logged-in").remove();
            break;
    }
    const els = Array.from(document.querySelectorAll('[data-modes]')); // snapshot

    els.forEach(el => {
        const modes = el.dataset.modes.split(/\s+/);
        if (!modes.includes(mode)) el.remove();
    });
    switch (mode) {
        default:
        case "home":
        case "challenge":
        case "review":
            document.getElementById("trial-menu").remove();
            break;
        case "timeTrial":
            document.getElementById("common").remove();
            document.getElementById("logged-in").remove();
            document.getElementById("logged-out").remove();
            break;
    }
}

let setupEditor = () => {
    let editor = document.getElementById("editor");
    if (editor) {
        quill = new Quill('#editor', {
            theme: 'snow'
        });
    }
}

let setupLogout = () => {
    document.getElementById("logout").addEventListener('click', async (ev) => {
        try {
            const res = await fetch('/users/logout', {
                method: 'POST',               // use POST to match your route
                credentials: 'include',       // send HttpOnly cookie
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!res.ok) {
                console.error('Logout failed', res.status);
                // show a simple message — replace with nicer UI as needed
                alert('Logout failed. Please try again.');
            }
            window.location.href = "/";
        } catch (err) {
            console.error('Logout error', err);
            alert('Network error while logging out.');
        }
    })
}

await setupPage();
setupEditor();
setupLogout();

export default quill;