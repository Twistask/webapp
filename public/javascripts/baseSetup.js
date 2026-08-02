let quill = undefined;
let mode = localStorage.getItem("mode");

let setupPage = () => {
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
            document.getElementById("menu-left").remove();
            document.getElementById("menu-right").remove();
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

let setupSubmit = () => {
    let submitbtn = document.getElementById("submit");
    if (submitbtn) {
        submitbtn.addEventListener("click", async () => {
            let target = localStorage.getItem("currentTargetID");
            let grade = undefined;
            if (document.getElementById("review-grade") !== null) {
                grade = document.getElementById("review-grade").value;
            }
            let sound = new Audio()
            sound.src = "../sounds/emblem.wav";
            document.body.appendChild(sound);
            sound.volume = 0.5;
            await sound.play();
            const res = await fetch(`/${mode}/submit`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    "target_id": target,
                    "grade": grade,
                    "value": quill.getSemanticHTML()
                })
            });
        })
    }
}

setupPage();
setupEditor();
setupSubmit();