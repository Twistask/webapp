// Editor page controls (create/update/delete) with safer guards
const EditorControls = (() => {
  function safeQuery(sel) { try { return document.querySelector(sel); } catch (e) { console.warn('Invalid selector', sel, e); return null; } }

  function setup() {
    try {
      setupFileImport();
      setupSubmit();
      setupDelete();
    } catch (err) { console.error('EditorControls.setup failed', err); }
  }

  function setupFileImport() {
    try {
      const fileInput = safeQuery('#markdown-import');
      const editorEl = safeQuery('#editor');
      if (!fileInput || !editorEl) return;

      fileInput.addEventListener('change', async (ev) => {
        const f = ev.target.files && ev.target.files[0];
        if (!f) return;
        try {
          const text = await f.text();
          // If toastui is present, setMarkdown, otherwise set content
          if (window.toastui && window.toastui.Editor && editorEl) {
            try { const ed = window.toastui.Editor.getInstance ? window.toastui.Editor.getInstance(editorEl) : null; if (ed && typeof ed.setMarkdown === 'function') ed.setMarkdown(text); else editorEl.textContent = text; } catch (e) { editorEl.textContent = text; }
          } else {
            editorEl.textContent = text;
          }
        } catch (e) { console.error('File read failed', e); }
      });
    } catch (err) { console.error('setupFileImport error', err); }
  }

  function setupSubmit() {
    try {
      const submitBtn = safeQuery('#submit'); if (!submitBtn) return;
      submitBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        submitBtn.disabled = true;
        try {
          const titleEl = safeQuery('#task-title'); const title = titleEl ? String(titleEl.value || titleEl.textContent || '') : '';
          const editorEl = safeQuery('#editor');
          let value = editorEl ? String(editorEl.innerText || editorEl.textContent || '') : '';

          const payload = { title: title, value: value };
          const res = await fetch('/editor/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
          if (!res.ok) {
            console.warn('Editor submit failed', res.status);
            return;
          }
          // Optionally navigate or show success
          window.location.href = '/editor';
        } catch (e) { console.error('submit failed', e); }
        finally { try { submitBtn.disabled = false; } catch (_) {} }
      });
    } catch (err) { console.error('setupSubmit error', err); }
  }

  function setupDelete() {
    try {
      const delBtn = safeQuery('#delete'); if (!delBtn) return;
      delBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        if (!confirm('Delete this task? This action cannot be undone.')) return;
        delBtn.disabled = true;
        try {
          const id = safeQuery('#challenge-select')?.value || null;
          if (!id) { console.warn('No id found to delete'); return; }
          const res = await fetch(`/editor/delete/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
          if (!res.ok) { console.warn('Delete failed', res.status); return; }
          window.location.href = '/editor';
        } catch (e) { console.error('delete failed', e); } finally { try { delBtn.disabled = false; } catch (_) {} }
      });
    } catch (err) { console.error('setupDelete error', err); }
  }

  return { setup };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { try { EditorControls.setup(); } catch (e) { console.error(e); } });
  else try { EditorControls.setup(); } catch (e) { console.error(e); }
}

export default EditorControls;
