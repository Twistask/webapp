import quill from "./baseSetup.js";

let setupSubmit = () => {
    let submitbtn = document.getElementById("submit");
    if (submitbtn) {
        submitbtn.addEventListener("click", async () => {
            let sound = new Audio()
            sound.src = "../sounds/emblem.wav";
            document.body.appendChild(sound);
            sound.volume = 0.5;
            await sound.play();
            const res = await fetch(`/editor/submit`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "author": document.getElementById("author-name").value,
                    "title": document.getElementById("task-title").value,
                    "description": quill.getSemanticHTML()
                })
            });
        })
    }
}

setupSubmit();