document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu').addEventListener('click', (ev) => {
        const a = ev.target.closest('a[data-mode]');
        if (!a) return;
        localStorage.setItem('mode', a.dataset.mode);
    });
    document.getElementById("timeTrial-link").addEventListener('click', (ev) => {
        let tasknum = Number(prompt("How many tasks would you like to solve?", "1"))
        if (tasknum > 0) {
            let answer = confirm("Once you start the Time Trial, you must complete all of the tasks. Are you sure?");
            if (answer === true) {
                localStorage.setItem("mode", "timeTrial");
                localStorage.setItem("tasks_number", tasknum);
                localStorage.setItem("trialTime", String(20 * 60 * 1000));
                window.location.href += "/challenge";
            }
        }
    })
});