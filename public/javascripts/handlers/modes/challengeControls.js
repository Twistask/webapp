// Safer ChallengeControls: guards, fallbacks, and robust network handling
const ChallengeControls = (() => {
  const app = (typeof window !== 'undefined' && window.APP) ? window.APP : {};
  const { tasks = [], user = {} } = app;
  let editor = null;
  let viewer = null;

  function safeQuery(sel) {
    try { return document.querySelector(sel); } catch (e) { console.warn('Invalid selector', sel, e); return null; }
  }

  function setup() {
    try {
      createChallengeItems();
      setupEditor();
      const select = safeQuery('#challenge-select');
      if (select) select.addEventListener('change', setupTask);
      setupTask();
      setupSubmit();
    } catch (err) {
      console.error('ChallengeControls.setup failed', err);
    }
  }

  function setupEditor() {
    try {
      const editorEl = safeQuery('#editor');
      const viewerEl = safeQuery('#viewer');
      if (!editorEl) { console.warn('Editor element not found'); return; }

      if (window.toastui && window.toastui.Editor) {
        try {
          const Editor = window.toastui.Editor;
          editor = new Editor({ el: editorEl, height: '500px', initialEditType: 'wysiwyg', previewStyle: 'vertical' });
          if (viewerEl) viewer = Editor.factory({ el: viewerEl, viewer: true, height: '500px', initialValue: '# hello' });
        } catch (e) {
          console.warn('toastui init failed', e);
          editor = null;
        }
      } else {
        // fallback: make editable
        editorEl.setAttribute('contenteditable', 'true');
        editor = null;
        if (viewerEl) viewer = viewerEl;
      }
    } catch (err) { console.error('setupEditor error', err); }
  }

  function createChallengeItems() {
    try {
      const select = safeQuery('#challenge-select');
      if (!select || !Array.isArray(tasks)) return;
      // clear existing
      select.innerHTML = '';
      tasks.forEach((item) => {
        try {
          const opt = document.createElement('option');
          opt.value = String(item.id);
          opt.textContent = String(item.title || 'Untitled');
          select.appendChild(opt);
        } catch (e) { console.warn('Failed to add option', e); }
      });
    } catch (err) { console.error('createChallengeItems error', err); }
  }

  function setupTask() {
    try {
      const select = safeQuery('#challenge-select');
      if (!select || !Array.isArray(tasks) || tasks.length === 0) return;
      const value = String(select.value || select.options[0]?.value || '');
      const task = tasks.find((t) => String(t.id) === value) || tasks[0];
      if (!task) return;

      if (viewer && typeof viewer.setMarkdown === 'function') {
        try { viewer.setMarkdown(String(task.description || '')); } catch (e) { console.warn('viewer.setMarkdown failed', e); }
      } else {
        const v = safeQuery('#viewer'); if (v) v.textContent = String(task.description || '');
      }

      if (editor && typeof editor.reset === 'function') {
        try { editor.reset(); } catch (e) { console.warn('editor.reset failed', e); }
      } else {
        const ed = safeQuery('#editor'); if (ed) ed.innerHTML = '<p><br></p>';
      }

      try { localStorage.setItem('currentTargetID', String(task.id)); } catch (e) { console.warn('localStorage set failed', e); }
    } catch (err) { console.error('setupTask error', err); }
  }

  async function setupSubmit() {
    try {
      const submitBtn = safeQuery('#submit'); if (!submitBtn) return;
      submitBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        try {
          const target = localStorage.getItem('currentTargetID');
          let authorVal = null;
          const aInp = safeQuery('#author-name');
          if (aInp) authorVal = (aInp.value || '').trim();
          else authorVal = user && user.id ? user.id : '';

          let value = '';
          if (editor && typeof editor.getMarkdown === 'function') value = String(await editor.getMarkdown());
          else {
            const ed = safeQuery('#editor'); value = ed ? String(ed.innerText || ed.textContent || '') : '';
          }

          // Disable to prevent duplicates
          submitBtn.disabled = true;
          const res = await fetch('/challenge/submit', {
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author: authorVal, target_id: target, value: value })
          });

          if (!res.ok) {
            console.warn('Submit failed', res.status);
            // re-enable for retry
            submitBtn.disabled = false;
            return;
          }

          // Move to next item if available
          const select = safeQuery('#challenge-select');
          if (select) {
            const current = select.selectedIndex || 0;
            const lastIndex = Math.max(0, select.options.length - 1);
            select.selectedIndex = (current < lastIndex) ? current + 1 : 0;
            setupTask();
          }
        } catch (e) {
          console.error('submit handler failed', e);
        } finally {
          try { submitBtn.disabled = false; } catch (_) {}
        }
      });
    } catch (err) { console.error('setupSubmit error', err); }
  }

  return { setup };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { try { ChallengeControls.setup(); } catch (e) { console.error(e); } });
  else try { ChallengeControls.setup(); } catch (e) { console.error(e); }
}

export default ChallengeControls;
