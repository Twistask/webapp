// settingsHandler: safer handling of settings form and delete account
const SettingsHandler = (() => {
  function safeQuery(sel) { try { return document.querySelector(sel); } catch (e) { console.warn('Invalid selector', sel, e); return null; } }

  function setup() {
    try {
      const form = safeQuery('#password-change');
      if (form) {
        form.addEventListener('submit', async (ev) => {
          ev.preventDefault();
          try {
            const fd = new FormData(form); const payload = {};
            for (const [k,v] of fd.entries()) payload[k] = v;
            const submitBtn = safeQuery('#submit_pw'); if (submitBtn) submitBtn.disabled = true;
            const res = await fetch(form.action || '/users/settings', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) { console.warn('Change password failed', res.status); return; }
            window.location.href = '/';
          } catch (e) { console.error('Password change failed', e); }
          finally { const submitBtn = safeQuery('#submit_pw'); if (submitBtn) submitBtn.disabled = false; }
        });
      }

      const delBtn = safeQuery('#delete_account');
      if (delBtn) {
        delBtn.addEventListener('click', async (ev) => {
          ev.preventDefault();
          if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
          delBtn.disabled = true;
          try {
            const res = await fetch('/users/delete', { method: 'DELETE', credentials: 'include' });
            if (!res.ok) { console.warn('Delete account failed', res.status); return; }
            window.location.href = '/';
          } catch (e) { console.error('Delete account failed', e); } finally { try { delBtn.disabled = false; } catch (_) {} }
        });
      }

    } catch (err) { console.error('SettingsHandler.setup failed', err); }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
  }

  return { setup };
})();

export default SettingsHandler;
