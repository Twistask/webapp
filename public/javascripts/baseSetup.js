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

setupPage();
setupEditor();

export default quill;