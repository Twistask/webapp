// Viewer controls: render main and children safely into DOM without using innerHTML unsafely
const ViewerControls = (() => {
  function safeQuery(sel) { try { return document.querySelector(sel); } catch (e) { console.warn('Invalid selector', sel, e); return null; } }

  function renderViewer() {
    try {
      const data = (typeof window !== 'undefined' && window.VIEWER) ? window.VIEWER : { main: {}, children: [] };
      const main = data.main || {};
      const children = Array.isArray(data.children) ? data.children : [];

      const titleEl = safeQuery('#task-title');
      if (titleEl) titleEl.textContent = String(main.title || '');

      const viewerEl = safeQuery('#viewer');
      if (viewerEl) viewerEl.textContent = String(main.description || '');

      const chArea = safeQuery('#ch-area');
      if (chArea) {
        chArea.innerHTML = '';
        children.forEach((c) => {
          try {
            const div = document.createElement('div');
            const h = document.createElement('h3'); h.textContent = String(c.title || 'Answer');
            const p = document.createElement('p'); p.textContent = String(c.summary || c.preview || '');
            div.appendChild(h); div.appendChild(p);
            chArea.appendChild(div);
          } catch (e) { console.warn('Failed to render child', e); }
        });
      }
    } catch (err) { console.error('renderViewer failed', err); }
  }

  return { renderViewer };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { try { ViewerControls.renderViewer(); } catch (e) { console.error(e); } });
  else try { ViewerControls.renderViewer(); } catch (e) { console.error(e); }
}

export default ViewerControls;
