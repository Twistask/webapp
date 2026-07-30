document.getElementById("submit").addEventListener("click", () => {
    let sound = new Audio()
    sound.src = "../sounds/emblem.wav";
    document.body.appendChild(sound);
    sound.volume = 0.5;
    sound.play();
})