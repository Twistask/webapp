import { t } from "../../utils/i18n.js";

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
    // Append, don't overwrite: profile.ejs's #my-tasks/#my-answers/
    // #my-reviews each already contain a static <h1> heading - setting
    // .textContent here would wipe that heading out along with whatever
    // was rendered before it.
    if (cards.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = emptyMessage;
        container.appendChild(empty);
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

    const createdTasks = tasks.filter((tk) => tk.author === user.id);
    const createdAns = answers.filter((tk) => tk.author === user.id);
    const createdComms = comments.filter((tk) => tk.author === user.id);

    renderGrid(
        tasksDiv,
        createdTasks.map((task) => buildCard(`/tasks/${task.id}`, task.title, t('common.viewThisTask'))),
        t('profile.noTasks'),
    );

    const answerCards = [];
    for (const ans of createdAns) {
        const task = tasks.find((tk) => tk.id === ans.target_id);
        if (!task) continue; // orphaned answer (its task was deleted)
        answerCards.push(buildCard(`/answers/${ans.id}`, task.title, t('profile.viewAnswer')));
    }
    renderGrid(answersDiv, answerCards, t('profile.noAnswers'));

    const commentCards = [];
    for (const comm of createdComms) {
        const answer = answers.find((a) => a.id === comm.target_id);
        if (!answer) continue; // orphaned comment (its answer was deleted)
        const task = tasks.find((tk) => tk.id === answer.target_id);
        if (!task) continue; // orphaned answer (its task was deleted)
        commentCards.push(buildCard(`/answers/${comm.target_id}`, task.title, t('profile.viewReview')));
    }
    renderGrid(commentsDiv, commentCards, t('profile.noReviews'));
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loader();
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
});
