document.getElementById("submit").addEventListener("click", async () => {
    let sound = new Audio()
    sound.src = "../sounds/emblem.wav";
    document.body.appendChild(sound);
    sound.volume = 0.5;
    await sound.play();
    await fetch('/users/login/submit', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
        })
    });
    window.location.href = "/";
});