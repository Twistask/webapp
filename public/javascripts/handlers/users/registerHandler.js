document.getElementById("submit").addEventListener("click", async () => {
  let sound = new Audio();
  sound.src = "../sounds/emblem.wav";
  document.body.appendChild(sound);
  sound.volume = 0.5;
  await sound.play();
  await fetch("/users/register/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: document.getElementById("email").value,
      emailVisibility: false,
      name: document.getElementById("username").value,
      password: document.getElementById("password").value,
      passwordConfirm: document.getElementById("password_repeat").value,
    }),
  });
  window.location.href = "/";
});
