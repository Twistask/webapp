const buildCard = (answer, task) => {
    const card = document.createElement("a");
    card.className = "task-card";
    card.href = `/review/${answer.id}`;

    const title = document.createElement("span");
    title.className = "task-card-title";
    // textContent, not innerHTML: task titles are user-authored content
    // and must never be parsed as markup.
    title.textContent = task.title;

    const cta = document.createElement("span");
    cta.className = "task-card-cta";
    cta.textContent = "Review this answer →";

    card.append(title, cta);
    return card;
};

export const ReviewQueue = {
    setup: () => {
        ReviewQueue.render();
        window.addEventListener("app:languagechange", ReviewQueue.render);
    },
    render: () => {
        const { tasks = [], answers = [] } = window.APP || {};
        const list = document.getElementById("review-list");
        if (!list) return;

        // Clear out whatever was rendered for the previous language
        // before rebuilding - this runs again on "app:languagechange",
        // not just once at page load.
        list.innerHTML = "";

        // res.locals.answers is already filtered server-side to exclude
        // the current user's own answers - self-review is blocked there
        // too, but there's no reason to show someone their own answer in
        // a list meant for reviewing other people's work.
        const availableAnswers = answers.filter((a) => a.language === sessionStorage.getItem("language"));

        const cards = [];
        for (const answer of availableAnswers) {
            const task = tasks.find((t) => t.id === answer.target_id);
            if (!task) continue; // orphaned answer (its task was deleted)
            cards.push(buildCard(answer, task));
        }

        if (cards.length === 0) {
            list.textContent = "There's nothing to review right now in this language.";
            return;
        }

        const grid = document.createElement("div");
        grid.className = "task-grid";
        for (const card of cards) grid.appendChild(card);
        list.appendChild(grid);
    },
};

document.addEventListener("DOMContentLoaded", () => {
    try {
        ReviewQueue.setup();
    } catch (err) {
        console.error("Failed to load review queue:", err);
        const list = document.getElementById("review-list");
        if (list) list.textContent = "Something went wrong loading this page. Please refresh and try again.";
    }
});
