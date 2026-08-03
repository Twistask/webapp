import quill from "./baseSetup.js";
import {checkAuthStatus} from "./handlers/users/authHelper.js";

let setupSubmit = () => {
    let submitbtn = document.getElementById("submit");
    if (submitbtn) {
        submitbtn.addEventListener("click", async () => {
            let sound = new Audio()
            sound.src = "../sounds/emblem.wav";
            document.body.appendChild(sound);
            sound.volume = 0.5;
            await sound.play();
            let auth = await checkAuthStatus();
            let author = auth.user.record.id;
            const res = await fetch(`/editor/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "author": author,
                    "title": document.getElementById("task-title").value,
                    "description": quill.getSemanticHTML()
                })
            });
        })
    }
}

setupSubmit();