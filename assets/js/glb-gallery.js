/* Fixed comparisons load via model-viewer's native viewport lazy loading. */
(() => {
  'use strict';
  document.querySelectorAll('[data-glb-card]').forEach(card => {
    const viewer = card.querySelector('model-viewer');
    const error = card.querySelector('[data-glb-error]');
    const retry = card.querySelector('[data-glb-retry]');
    viewer.addEventListener('load', () => { error.hidden = true; });
    viewer.addEventListener('error', () => { error.hidden = false; });
    retry.addEventListener('click', async () => {
      error.hidden = true;
      const src = viewer.getAttribute('src');
      viewer.removeAttribute('src');
      await viewer.updateComplete;
      viewer.setAttribute('src', src);
    });
    // A cached model may finish before this deferred script runs.
    if (viewer.loaded) error.hidden = true;
  });
})();
