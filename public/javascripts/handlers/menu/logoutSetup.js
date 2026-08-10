// Safer logout setup: guard element, avoid throwing on missing fetch response body
(() => {
  async function doLogout() {
    try {
      const res = await fetch('/users/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      let body = null;
      try {
        body = await res.json();
      } catch (_) {
        // non-json reply is fine
      }

      if (!res.ok) {
        console.warn('Logout failed', res.status, body);
        // show a gentle message rather than blocking alerts in production
        try {
          const el = document.getElementById('error-box');
          if (el) el.textContent = 'Logout failed. Please try again.';
        } catch (_) {}
      }

      // Redirect to home regardless to ensure the client sees the logged-out state.
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error', err);
      // avoid throwing; provide feedback if possible
      try {
        const el = document.getElementById('error-box');
        if (el) el.textContent = 'Network error while logging out.';
      } catch (_) {}
    }
  }

  function setup() {
    try {
      const logoutBtn = document.getElementById('logout');
      if (!logoutBtn) return;
      logoutBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        // disable button to avoid double clicks
        logoutBtn.disabled = true;
        doLogout().finally(() => {
          // ensure button is re-enabled only if we remain on the page
          try { logoutBtn.disabled = false; } catch (_) {}
        });
      });
    } catch (err) {
      console.error('Error setting up logout handler', err);
    }
  }

  // init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
