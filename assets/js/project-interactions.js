/* Controls for the project presentations authored directly in HTML. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const main = document.querySelector('main');
  if (!main) return;

  // Metric alternatives are already in this page; switching never fetches or
  // reconstructs the page's layout, text, tables, or initial chart.
  document.addEventListener('change', event => {
    const select = event.target.closest('select[data-chart-target]');
    if (!select) return;
    const target = document.getElementById(select.dataset.chartTarget);
    const template = document.querySelector(`template[data-chart-target="${CSS.escape(select.dataset.chartTarget)}"][data-chart-option="${CSS.escape(select.value)}"]`);
    if (target && template) target.replaceChildren(template.content.cloneNode(true));
  });
  const tabs = main.querySelector('.pyratok-task-tabs');
  if (tabs) {
    const panel = main.querySelector('.pyratok-task-panel');
    const show = button => {
      const template = document.getElementById(button.dataset.panelTemplate);
      if (!template) return;
      panel.replaceChildren(template.content.cloneNode(true));
      panel.setAttribute('aria-labelledby', button.id);
      [...tabs.children].forEach(tab => {
        const selected = tab === button;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
    };
    tabs.addEventListener('click', event => {
      const button = event.target.closest('button[data-panel-template]');
      if (button) show(button);
    });
    tabs.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const buttons = [...tabs.children], index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      show(buttons[next]);buttons[next].focus();
    });
  }

  main.querySelectorAll('model-viewer').forEach(viewer => {
    const button = viewer.parentElement.querySelector('button[data-camera-orbit]');
    if (button) {
      button.disabled = !viewer.loaded;
      viewer.addEventListener('load', () => { button.disabled = false; }, { once: true });
      button.addEventListener('click', () => {
        viewer.cameraOrbit = button.dataset.cameraOrbit;
        viewer.cameraTarget = 'auto auto auto';viewer.fieldOfView = 'auto';
        ['cameraOrbit', 'cameraTarget', 'fieldOfView'].forEach(property => viewer.requestUpdate(property));
        viewer.jumpCameraToGoal();
      });
    }
    const loaded = () => viewer.closest('.core3d-model-card,.dreampartgen-model-card')?.classList.add('is-loaded');
    if (viewer.loaded) loaded(); else viewer.addEventListener('load', loaded, { once: true });
  });
  main.querySelectorAll('[data-resource="Interactive 3D Models"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();history.pushState(null, '', link.getAttribute('href'));
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
      const heading = target.querySelector('h2');heading.tabIndex = -1;heading.focus({ preventScroll: true });
    });
  });

  const measure = document.createElement('canvas').getContext('2d');
  const endings = new ResizeObserver(entries => entries.forEach(({ target: paragraph }) => {
    const ending = paragraph.querySelector('.studio-ending');if (!ending) return;
    const style = getComputedStyle(paragraph);measure.font = style.font;
    const available = paragraph.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) - 12;
    ending.style.whiteSpace = measure.measureText(ending.textContent.replace(/\s+/g, ' ')).width < available ? 'nowrap' : 'normal';
  }));
  main.querySelectorAll('p:has(.studio-ending)').forEach(paragraph => endings.observe(paragraph));

  const videos = new IntersectionObserver(entries => entries.forEach(({ target: video, isIntersecting }) => {
    if (!isIntersecting || reduced) video.pause();
    else if (video.dataset.studioAutoplay === 'true' && video.dataset.studioPaused !== 'true') video.play().catch(() => {});
  }), { threshold: .15 });
  main.querySelectorAll('video:not([data-force-preview])').forEach(video => {
    if (video.closest('#video-grid')) return; // EditVid synchronizes its comparison row.
    if (video.dataset.playbackRate) video.playbackRate = Number(video.dataset.playbackRate);
    if (reduced) { video.removeAttribute('autoplay');video.pause(); }
    videos.observe(video);
  });

  const forceButton = main.querySelector('[data-force-playback]');
  if (forceButton) {
    const previews = [...main.querySelectorAll('video[data-force-preview]')].map(video => ({
      video, svg: video.parentElement.querySelector('.studio-force-vector'), visible: false,
      paused: reduced, internalPause: false, timer: null
    }));
    const cancel = item => { clearTimeout(item.timer);item.timer = null; };
    const sync = () => {
      const paused = previews.every(item => item.paused);
      forceButton.dataset.paused = String(paused);forceButton.textContent = paused ? 'Play videos' : 'Pause videos';
    };
    const pause = item => { cancel(item);if (!item.video.paused) { item.internalPause = true;item.video.pause(); } };
    const start = item => {
      cancel(item);if (!item.visible || item.paused) return;
      const play = () => item.video.play().catch(() => { item.paused = true;sync(); });
      if (item.video.ended) item.video.currentTime = 0;
      if (item.video.currentTime < .05) { item.svg.removeAttribute('hidden');item.timer = setTimeout(play, 1400); }
      else play();
    };
    forceButton.addEventListener('click', () => {
      const paused = forceButton.dataset.paused !== 'true';
      previews.forEach(item => { item.paused = paused;if (paused) pause(item);else start(item); });sync();
    });
    const observer = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
      const item = previews.find(item => item.video === target);item.visible = isIntersecting;
      if (isIntersecting) start(item);else pause(item);
    }), { threshold: .25 });
    previews.forEach(item => {
      item.video.addEventListener('playing', () => { cancel(item);item.svg.setAttribute('hidden', '');item.paused = false;sync(); });
      item.video.addEventListener('pause', () => { if (!item.internalPause && !item.video.ended) { item.paused = true;sync(); }item.internalPause = false; });
      item.video.addEventListener('ended', () => { item.video.currentTime = 0;item.svg.removeAttribute('hidden');start(item); });
      observer.observe(item.video);
    });sync();
  }

  const speed = main.querySelector('#vtam-playback-rate');
  if (speed) {
    const toggle = main.querySelector('.vtam-playback-bar button');
    const connect = () => {
      const players = [...main.querySelectorAll('.vtam-task-group iframe')].map(frame => window.Stream(frame));
      let paused = reduced;
      const label = () => { toggle.textContent = paused ? 'Play all' : 'Pause all'; };
      const apply = player => {
        player.muted = true;player.loop = true;player.playbackRate = Number(speed.value);
        if (paused) player.pause();else Promise.resolve(player.play()).catch(() => {});
      };
      players.forEach(player => { apply(player);player.addEventListener('loadedmetadata', () => apply(player)); });
      speed.addEventListener('change', () => players.forEach(player => { player.playbackRate = Number(speed.value); }));
      toggle.addEventListener('click', () => { paused = !paused;players.forEach(apply);label(); });
      toggle.disabled = false;speed.disabled = false;label();
    };
    if (typeof window.Stream === 'function') connect();
    else {
      const script = document.createElement('script');script.src = 'https://embed.cloudflarestream.com/embed/sdk.latest.js';script.async = true;
      script.onload = () => { if (typeof window.Stream === 'function') connect(); };
      script.onerror = () => { main.querySelector('.vtam-playback-status').textContent = 'Use each video’s playback controls.'; };
      document.head.append(script);
    }
  }
})();
