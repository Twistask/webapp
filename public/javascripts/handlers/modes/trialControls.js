import { convertToString } from '../../utils/timeConverter.js';

// TrialControls: make robust against missing DOM, missing libraries, and unavailable data
const TrialControls = (() => {
  let solutions = new Map();
  let counter = 0;
  let editor = null;
  let viewer = null;
  let intervalId = null;
  let timeoutId = null;

  const app = (typeof window !== 'undefined' && window.APP) ? window.APP : {};
  const { tasks = [] } = app;
  const trial = (typeof window !== 'undefined' && window.TRIAL) ? window.TRIAL : {};
  const author = (typeof window !== 'undefined' && window.AUTHOR) ? String(window.AUTHOR || '') : '';

  function safeQuery(selector) {
    try {
      return document.querySelector(selector);
    } catch (err) {
      console.warn('Invalid selector', selector, err);
      return null;
    }
  }

  async function setup() {
    try {
      setupEditor();
      setupTask();
      setupTimer(trial && Number(trial.trialTime));
      setupSubmit();
      blockInput();
    } catch (err) {
      console.error('TrialControls.setup failed', err);
    }
  }

  function setupEditor() {
    // If toastui is available, use it; otherwise fallback to a plain textarea for compatibility
    try {
      const editorEl = safeQuery('#editor');
      const viewerEl = safeQuery('#viewer');

      if (!editorEl) {
        console.warn('Editor element not found (#editor)');
        return;
      }

      if (window.toastui && window.toastui.Editor) {
        const Editor = window.toastui.Editor;
        try {
          editor = new Editor({
            el: editorEl,
            height: '500px',
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical'
          });
        } catch (e) {
          console.warn('toastui Editor init failed, falling back to textarea', e);
          editor = null;
        }

        if (viewerEl) {
          try {
            viewer = Editor.factory({ el: viewerEl, viewer: true, height: '500px', initialValue: '# hello' });
          } catch (e) {
            console.warn('toastui Viewer init failed', e);
            viewer = null;
          }
        }
      } else {
        // no toastui present; ensure editorEl is contenteditable
        editorEl.setAttribute('contenteditable', 'true');
        editor = null; // we will read innerText/innerHTML when needed
        if (viewerEl) viewer = viewerEl;
      }
    } catch (err) {
      console.error('setupEditor error', err);
    }
  }

  function setupTask() {
    try {
      if (!Array.isArray(tasks) || tasks.length === 0) {
        console.warn('No tasks available for trial');
        const viewerEl = safeQuery('#viewer');
        if (viewerEl) viewerEl.textContent = 'No tasks available.';
        // disable submit if present
        const submitBtn = document.getElementById('submit');
        if (submitBtn) submitBtn.disabled = true;
        return;
      }

      const randIndex = Math.floor(Math.random() * tasks.length);
      const chosenTask = tasks[randIndex];
      if (!chosenTask) {
        console.warn('Chosen task is undefined');
        return;
      }

      if (viewer && typeof viewer.setMarkdown === 'function') {
        try {
          viewer.setMarkdown(String(chosenTask.description || ''));
        } catch (e) {
          console.warn('viewer.setMarkdown failed', e);
        }
      } else {
        const viewerEl = safeQuery('#viewer');
        if (viewerEl) viewerEl.textContent = String(chosenTask.description || '');
      }

      try {
        localStorage.setItem('currentTargetID', String(chosenTask.id));
      } catch (e) {
        console.warn('localStorage set failed', e);
      }
    } catch (err) {
      console.error('setupTask error', err);
    }
  }

  function setupSubmit() {
    try {
      const submitBtn = document.getElementById('submit');
      if (!submitBtn) return;

      submitBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        // read current target from storage fresh
        const target = localStorage.getItem('currentTargetID');
        let value = '';
        try {
          if (editor && typeof editor.getMarkdown === 'function') {
            value = String(await editor.getMarkdown());
          } else {
            const editorEl = safeQuery('#editor');
            value = editorEl ? String(editorEl.innerText || editorEl.textContent || '') : '';
          }
        } catch (e) {
          console.warn('Failed to read editor value', e);
        }

        // Add solution and attempt submission
        addSolution(target, value);

        // pick a new task after collecting solution
        setupTask();

        try {
          if (solutions.size >= Number(trial.tasksAmount || 0)) {
            await sendSolutions();
            console.log('Trial complete');
          }
        } catch (e) {
          console.error('Error sending solutions', e);
        }
      });
    } catch (err) {
      console.error('setupSubmit error', err);
    }
  }

  function setupTimer(trialTime) {
    try {
      const ms = Number(trialTime) || 0;
      if (ms <= 0) return;

      const start = Date.now();
      timeoutId = setTimeout(() => {
        try {
          alert("Time's up!");
          window.location.href = '/';
        } catch (e) {
          console.warn('Redirect failed', e);
        }
      }, ms);

      const timeDiv = document.createElement('div');
      const timerValue = document.createElement('p');
      timerValue.setAttribute('aria-live', 'polite');

      // update every 500ms — 1ms is too frequent and will throttle the browser
      intervalId = setInterval(() => {
        try {
          const remaining = Math.max(0, ms - (Date.now() - start));
          timerValue.innerText = `Time left: ${convertToString(remaining)}`;
        } catch (e) {
          console.warn('Timer update failed', e);
        }
      }, 500);

      timeDiv.appendChild(timerValue);
      const menu = document.getElementById('trial-menu');
      if (menu) menu.appendChild(timeDiv);
    } catch (err) {
      console.error('setupTimer error', err);
    }
  }

  function blockInput() {
    try {
      document.addEventListener('keydown', function (event) {
        const isF5 = event.key === 'F5';
        const isCtrlR = event.ctrlKey && (event.key === 'r' || event.key === 'R');

        if (isF5 || isCtrlR) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      });
    } catch (err) {
      console.error('blockInput error', err);
    }
  }

  function submitPuzzle(id, value) {
    try {
      addSolution(id, value);
      if (solutions.size >= Number(trial.tasksAmount || 0)) {
        return sendSolutions();
      }
      return Promise.resolve();
    } catch (err) {
      console.error('submitPuzzle error', err);
      return Promise.reject(err);
    }
  }

  function addSolution(id, value) {
    try {
      const key = counter++;
      solutions.set(key, { id: id, value: value });
      console.debug('Added solution', key, id);
    } catch (err) {
      console.error('addSolution error', err);
    }
  }

  async function sendSolutions() {
    try {
      const arr = Array.from(solutions.values());
      const promises = arr.map((ans) => {
        return fetch('/challenge/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ author: author, target_id: ans.id, value: ans.value })
        })
          .then((res) => ({ id: ans.id, ok: res.ok, status: res.status }))
          .catch((err) => ({ id: ans.id, ok: false, error: String(err) }));
      });

      const results = await Promise.all(promises);
      const anyFailed = results.some((r) => !r.ok);
      if (anyFailed) {
        console.error('Some submissions failed', results);
        // keep solutions for debugging or retry
        throw new Error('One or more submissions failed');
      }

      solutions.clear();
      return endTrial();
    } catch (err) {
      console.error('sendSolutions error', err);
      throw err;
    }
  }

  function endTrial() {
    try {
      // clear timers
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
      window.location.replace('/timeTrial/result');
    } catch (err) {
      console.error('endTrial error', err);
    }
  }

  // public API
  return {
    setup,
    submitPuzzle,
    addSolution,
    sendSolutions,
    endTrial
  };
})();

// initialize safely
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { TrialControls.setup().catch((e) => console.error(e)); });
  } else {
    Promise.resolve().then(() => TrialControls.setup()).catch((e) => console.error(e));
  }
}

export default TrialControls;
