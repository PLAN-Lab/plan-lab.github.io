/* Progressive enhancement: every preview remains a normal image link without JS. */
(() => {
  'use strict';
  if (!('HTMLDialogElement' in window)) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'conference-image-dialog';
  dialog.setAttribute('aria-labelledby', 'conference-image-title');
  dialog.innerHTML = `<div class="conference-image-toolbar">
    <h2 class="conference-image-title" id="conference-image-title"></h2>
    <div class="conference-image-actions">
      <button type="button" data-viewer-action="out" aria-label="Zoom out">−</button>
      <output aria-live="polite">Fit</output>
      <button type="button" data-viewer-action="in" aria-label="Zoom in">+</button>
      <button type="button" data-viewer-action="fit">Fit</button>
      <button type="button" data-viewer-action="actual" aria-label="Show image at 100 percent">100%</button>
      <a target="_blank" rel="noopener" data-viewer-original>Open original</a>
      <button type="button" data-viewer-action="close" autofocus>Close</button>
    </div></div>
    <div class="conference-image-stage" tabindex="0" aria-label="Image viewer; scroll to explore when zoomed in"><div class="conference-image-canvas"><img alt=""></div></div>
    <p class="conference-image-status" role="status">Loading image…</p>`;
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  const stage = dialog.querySelector('.conference-image-stage');
  const status = dialog.querySelector('.conference-image-status');
  const output = dialog.querySelector('output');
  let opener = null, scale = 1, fitMode = true;
  const fitScale = () => Math.min((stage.clientWidth - 32) / image.naturalWidth, (stage.clientHeight - 32) / image.naturalHeight, 1);
  function paint(center = false) {
    if (!image.naturalWidth || !dialog.open) return;
    if (fitMode) scale = fitScale();
    image.style.width = Math.max(1, Math.round(image.naturalWidth * scale)) + 'px';
    image.style.height = Math.max(1, Math.round(image.naturalHeight * scale)) + 'px';
    output.textContent = fitMode ? 'Fit' : Math.round(scale * 100) + '%';
    if (center) {
      stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
      stage.scrollTop = Math.max(0, (stage.scrollHeight - stage.clientHeight) / 2);
    }
  }
  image.addEventListener('load', () => {
    status.textContent = 'Use + or 100% to read details. Scroll to move around the image.';
    paint();
  });
  image.addEventListener('error', () => {
    status.textContent = 'The preview could not load. Use Open original to view the source file.';
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-poster-viewer]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    fitMode = true;
    scale = 1;
    const title = link.dataset.posterTitle || 'Research image';
    dialog.querySelector('h2').textContent = title;
    dialog.querySelector('[data-viewer-original]').href = link.href;
    image.alt = title;
    image.style.width = '1px';
    image.style.height = 'auto';
    status.textContent = 'Loading image…';
    image.src = link.href;
    document.body.classList.add('conference-viewer-open');
    dialog.showModal();
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
    if (image.complete && image.naturalWidth) {
      status.textContent = 'Use + or 100% to read details. Scroll to move around the image.';
      paint();
    }
  });
  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-viewer-action]')?.dataset.viewerAction;
    if (action === 'close') { dialog.close(); return; }
    if (action && image.naturalWidth) {
      if (action === 'fit') fitMode = true;
      else {
        fitMode = false;
        scale = action === 'actual' ? 1 : action === 'in' ? Math.min(4, scale * 1.5) : Math.max(Math.min(fitScale(), .05), scale / 1.5);
      }
      paint(true);
    }
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('conference-viewer-open');
    opener?.focus({preventScroll:true});
  });
  window.addEventListener('resize', () => paint(), {passive:true});
})();
