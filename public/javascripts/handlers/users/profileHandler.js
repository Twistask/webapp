// profileHandler: safely render profile items and attach event handlers
const ProfileHandler = (() => {
  function safeQuery(sel) { try { return document.querySelector(sel); } catch (e) { console.warn('Invalid selector', sel, e); return null; } }

  function setup() {
    try {
      // Example: render lists if APP.tasks / APP.answers are present
      const app = (typeof window !== 'undefined' && window.APP) ? window.APP : {};
      const { tasks = [], answers = [], comments = [] } = app;

      const tasksEl = safeQuery('#my-tasks');
      if (tasksEl) {
        const ul = document.createElement('ul');
        tasks.forEach(t => { const li = document.createElement('li'); li.textContent = String(t.title || 'Untitled'); ul.appendChild(li); });
        tasksEl.appendChild(ul);
      }

      const answersEl = safeQuery('#my-answers');
      if (answersEl) {
        const ul = document.createElement('ul');
        answers.forEach(a => { const li = document.createElement('li'); li.textContent = String(a.preview || a.summary || 'Answer'); ul.appendChild(li); });
        answersEl.appendChild(ul);
      }

      const reviewsEl = safeQuery('#my-reviews');
      if (reviewsEl) {
        const ul = document.createElement('ul');
        comments.forEach(c => { const li = document.createElement('li'); li.textContent = String(c.text || 'Comment'); ul.appendChild(li); });
        reviewsEl.appendChild(ul);
      }
    } catch (err) { console.error('ProfileHandler.setup failed', err); }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
  }

  return { setup };
})();

export default ProfileHandler;
