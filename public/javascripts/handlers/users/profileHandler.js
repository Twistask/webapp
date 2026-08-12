const { tasks = [], answers = [], comments = [], user = {} } = window.APP || {};

const buildCard = (href, title, cta) => {
    const card = document.createElement("a");
    card.className = "task-card";
    card.href = href;

    const titleEl = document.createElement("span");
    titleEl.className = "task-card-title";
    // textContent, not innerHTML: task titles are user-authored content
    // and must never be parsed as markup.
    titleEl.textContent = title;

    const ctaEl = document.createElement("span");
    ctaEl.className = "task-card-cta";
    ctaEl.textContent = cta;

    card.append(titleEl, ctaEl);
    return card;
};

const renderGrid = (container, cards, emptyMessage) => {
    if (!container) return;
    if (cards.length === 0) {
        container.textContent = emptyMessage;
        return;
    }
    const grid = document.createElement("div");
    // class, not id: profile.ejs can render up to three of these grids
    // (tasks/answers/reviews) on one page, so a shared id would be
    // invalid duplicate HTML.
    grid.className = "task-grid";
    for (const card of cards) grid.appendChild(card);
    container.appendChild(grid);
};

let loader = async () => {
    let tasksDiv = document.getElementById("my-tasks");
    let answersDiv = document.getElementById("my-answers");
    let commentsDiv = document.getElementById("my-reviews");

    const createdTasks = tasks.filter((t) => t.author === user.id);
    const createdAns = answers.filter((t) => t.author === user.id);
    const createdComms = comments.filter((t) => t.author === user.id);

    renderGrid(
        tasksDiv,
        createdTasks.map((task) => buildCard(`/tasks/${task.id}`, task.title, "View this task →")),
        "You haven't created any tasks yet.",
    );

    const answerCards = [];
    for (const ans of createdAns) {
        const task = tasks.find((t) => t.id === ans.target_id);
        if (!task) continue; // orphaned answer (its task was deleted)
        answerCards.push(buildCard(`/answers/${ans.id}`, task.title, "View your answer →"));
    }
    renderGrid(answersDiv, answerCards, "You haven't submitted any answers yet.");

    const commentCards = [];
    for (const comm of createdComms) {
        const answer = answers.find((a) => a.id === comm.target_id);
        if (!answer) continue; // orphaned comment (its answer was deleted)
        const task = tasks.find((t) => t.id === answer.target_id);
        if (!task) continue; // orphaned answer (its task was deleted)
        commentCards.push(buildCard(`/answers/${comm.target_id}`, task.title, "View your review →"));
    }
    renderGrid(commentsDiv, commentCards, "You haven't left any reviews yet.");
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loader();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
})
