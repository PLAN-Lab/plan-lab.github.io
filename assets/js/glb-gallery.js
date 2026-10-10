/* Selectable, on-demand galleries. Existing project viewers are untouched. */
(() => {
  'use strict';
  const metadata = fetch('../../assets/data/glb-galleries.json').then(r => {
    if (!r.ok) throw new Error('Credits unavailable');
    return r.json();
  }).catch(() => []);
  document.querySelectorAll('[data-glb-gallery]').forEach(gallery => {
    const viewer = gallery.querySelector('[data-glb-viewer]');
    const choice = gallery.querySelector('[data-glb-choice]');
    const load = gallery.querySelector('[data-glb-load]');
    const reset = gallery.querySelector('[data-glb-reset]');
    const status = gallery.querySelector('[data-glb-status]');
    const download = gallery.querySelector('[data-glb-download]');
    const input = gallery.querySelector('[data-glb-input]');
    const credit = gallery.querySelector('[data-glb-credit]');
    let active = false, generation = 0, timeout;
    const label = () => choice.selectedOptions[0].textContent;
    function resetView() {
      viewer.cameraOrbit = '35deg 75deg 105%';
      viewer.cameraTarget = 'auto auto auto';
      viewer.fieldOfView = 'auto';
      ['cameraOrbit', 'cameraTarget', 'fieldOfView'].forEach(property => viewer.requestUpdate(property));
      viewer.updateComplete.then(() => viewer.jumpCameraToGoal());
    }
    function fail() {
      clearTimeout(timeout);
      load.hidden = false;
      load.textContent = 'Retry 3D model';
      reset.disabled = true;
      status.textContent = 'The model could not be loaded. Retry or download the GLB.';
    }
    async function loadModel() {
      active = true;
      const request = ++generation;
      reset.disabled = true;
      load.hidden = true;
      status.textContent = `Loading ${label()}…`;
      clearTimeout(timeout);
      timeout = setTimeout(() => { if (request === generation) fail(); }, 120000);
      // Guard a missing or blocked model-viewer module without an infinite wait.
      let timer;
      try {
        await Promise.race([
          customElements.whenDefined('model-viewer'),
          new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Viewer unavailable')), 15000); })
        ]);
        if (request !== generation) return;
        if (viewer.getAttribute('src') === choice.value) viewer.removeAttribute('src');
        viewer.setAttribute('src', choice.value);
      } catch { if (request === generation) fail(); }
      finally { clearTimeout(timer); }
    }
    async function updateCredits(src) {
      const entries = await metadata;
      if (choice.value !== src) return;
      const absolute = new URL(src, document.baseURI).pathname;
      const data = entries.find(e => absolute.endsWith('/' + e.path))?.credits || {};
      credit.hidden = !data.author && !data.license;
      gallery.querySelector('[data-glb-author]').textContent = data.author || '';
      gallery.querySelector('[data-glb-license]').textContent = data.license || '';
      const link = gallery.querySelector('[data-glb-source]');
      link.hidden = true;
      if (data.source) {
        try { const url = new URL(data.source); if (['https:', 'http:'].includes(url.protocol)) { link.href = url.href; link.hidden = false; } } catch { /* no source link */ }
      }
    }
    function update() {
      viewer.alt = `${label()}. Drag or use arrow keys to rotate; scroll or pinch to zoom.`;
      download.href = choice.value;
      download.setAttribute('aria-label', `Download ${label()} as GLB`);
      if (input) { input.src = choice.value.replace(/\.glb$/, '_input.webp'); input.alt = `${label()} input image`; }
      updateCredits(choice.value);
      if (active) loadModel();
      else status.textContent = `Load ${label()} to explore it in 3D.`;
    }
    viewer.addEventListener('load', event => {
      if (event.detail?.url && new URL(event.detail.url, document.baseURI).href !== new URL(choice.value, document.baseURI).href) return;
      clearTimeout(timeout);
      load.hidden = true;
      reset.disabled = false;
      resetView();
      status.textContent = `${label()} · Drag to rotate. Scroll or pinch to zoom.`;
    });
    viewer.addEventListener('error', fail);
    load.addEventListener('click', loadModel);
    reset.addEventListener('click', resetView);
    choice.addEventListener('change', update);
    update();
  });
})();
