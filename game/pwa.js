/* ══════════════════════════════════════
   PWA: Service Worker + Install Prompt
══════════════════════════════════════ */

// Register Service Worker
//
// Update-Verhalten (bewusst NICHT sofort reloaden): Ein Update, das mitten
// in einer laufenden Runde die Seite neu lädt, kostet ein Kind seinen
// Fortschritt und wirkt wie ein Absturz. Stattdessen wird eine fertig
// installierte neue Version erst aktiviert (SKIP_WAITING), sobald die App
// wieder im Menü ist – nie während ein Level aktiv ist.
if ('serviceWorker' in navigator) {
  let pendingWorker = null;

  function isOnMenuScreen() {
    const active = document.querySelector('.screen.active')?.id;
    return active === 'start' || active === 'intro';
  }

  function applyPendingUpdateIfSafe() {
    if (pendingWorker && isOnMenuScreen()) {
      pendingWorker.postMessage('SKIP_WAITING');
      pendingWorker = null;
    }
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(reg => {
        console.log('[PWA] Service Worker registered, scope:', reg.scope);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version installed, will activate on next menu visit.');
              pendingWorker = newWorker;
              applyPendingUpdateIfSafe();
            }
          });
        });
      })
      .catch(err => console.warn('[PWA] Service Worker registration failed:', err));

    // Reload once after SW takes control (only triggers on update, not first load)
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        try { localStorage.setItem('oskar_just_updated', '1'); } catch (e) {}
        window.location.reload();
      }
    });
  });

  // showScreen() wird von JEDEM Level beim Zurückkehren ins Menü gerufen
  // (Home-Button, Level-Ende) – der ideale, immer erreichte Moment, um ein
  // wartendes Update sicher zu aktivieren.
  const _showScreenForUpdate = window.showScreen;
  if (typeof _showScreenForUpdate === 'function') {
    window.showScreen = function (id) {
      _showScreenForUpdate(id);
      if (id === 'start' || id === 'intro') applyPendingUpdateIfSafe();
    };
  }

  // Kleiner Hinweis nach einem gerade durchgeführten Update.
  window.addEventListener('load', () => {
    try {
      if (localStorage.getItem('oskar_just_updated')) {
        localStorage.removeItem('oskar_just_updated');
        setTimeout(() => {
          if (typeof showToast === 'function') showToast('✨ Oskar ist jetzt aktuell!', 2000);
        }, 1500);
      }
    } catch (e) {}
  });
}

// Install Prompt Logic
(function () {
  const DISMISSED_KEY = 'oskar_pwa_dismissed';
  const banner = document.getElementById('pwaInstallBanner');
  const installBtn = document.getElementById('pwaInstallBtn');
  const dismissBtn = document.getElementById('pwaDismissBtn');
  const hintEl = document.getElementById('pwaInstallHint');

  // Don't show if already dismissed or running as PWA
  if (localStorage.getItem(DISMISSED_KEY)) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return; // iOS standalone

  let deferredPrompt = null;

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function showBanner() {
    if (!banner) return;
    banner.style.display = 'flex';
  }

  // Android / Chrome: capture beforeinstallprompt
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    hintEl.textContent = 'Zum Home-Bildschirm hinzufügen';
    if (installBtn) installBtn.style.display = 'inline-block';
    showBanner();
  });

  // iOS: show manual instructions
  if (isIOS()) {
    hintEl.textContent = 'Tippe auf Teilen (⬆) und dann auf „Zum Home-Bildschirm".';
    showBanner();
  }

  // Android install button click
  if (installBtn) {
    installBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(result => {
        if (result.outcome === 'accepted') {
          localStorage.setItem(DISMISSED_KEY, '1');
          banner.style.display = 'none';
        }
        deferredPrompt = null;
      });
    });
  }

  // Dismiss button
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      localStorage.setItem(DISMISSED_KEY, '1');
      banner.style.display = 'none';
    });
  }

  // Hide once running as installed PWA
  window.matchMedia('(display-mode: standalone)').addEventListener('change', e => {
    if (e.matches) {
      localStorage.setItem(DISMISSED_KEY, '1');
      if (banner) banner.style.display = 'none';
    }
  });
})();
