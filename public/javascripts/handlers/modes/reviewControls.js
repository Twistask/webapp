// Review controls: safer handlers for submitting reviews and ratings
const ReviewControls = (() => {
  function safeQuery(sel) { try { return document.querySelector(sel); } catch (e) { console.warn('Invalid selector', sel, e); return null; } }

  function setup() {
    try {
      const form = safeQuery('#review-form');
      if (!form) return;
      form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        try {
          const data = {};
          const fd = new FormData(form);
          for (const [k, v] of fd.entries()) data[k] = v;

          const submitBtn = safeQuery('#submit'); if (submitBtn) submitBtn.disabled = true;
          const res = await fetch(form.action || '/review/submit', { method: form.method || 'POST', credentials: 'include', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } });
          if (!res.ok) { console.warn('Review submit failed', res.status); return; }
          // on success, reload or update UI
          window.location.reload();
        } catch (e) { console.error('review submit failed', e); }
      });
    } catch (err) { console.error('ReviewControls.setup failed', err); }
  }

  return { setup };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { try { ReviewControls.setup(); } catch (e) { console.error(e); } });
  else try { ReviewControls.setup(); } catch (e) { console.error(e); }
}

export default ReviewControls;
