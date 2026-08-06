document.getElementById("startTrial").addEventListener('click', async () => {
    const res = await fetch(`/timeTrial/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            difficulty: document.getElementById("difficulty").value,
            tasksAmount: document.getElementById("tasksAmount").value,
        }),
    });
})