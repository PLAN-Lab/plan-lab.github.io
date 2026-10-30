/* CoDA: chaptered media, a visual method walkthrough, and measured-result exploration. */
(() => {
  'use strict';
  const root = document.querySelector('.studio-coda');
  if (!root) return;
  const get = id => document.getElementById(id);
  const videos = [...root.querySelectorAll('video')];
  const pendingSeek = new WeakMap();
  let selection = 0;
  const status = get('coda-player-status');
  const player = get('coda-rollout-player');

  const play = video => {
    const requestedSelection = selection;
    const promise = video.play();
    if (promise) promise.catch(error => {
      if (video === player && selection === requestedSelection && error.name !== 'AbortError') {
        status.textContent = 'Use the video’s play control, or open the video below.';
      }
    });
  };
  const seek = (video, time) => {
    if (video.readyState >= 1) video.currentTime = Math.min(time, video.duration || time);
    else pendingSeek.set(video, time);
    play(video);
  };
  const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const playButtons = [...root.querySelectorAll('[data-play-video]')];
  playButtons.forEach(button => button.addEventListener('click', () => play(get(button.dataset.playVideo))));
  root.querySelectorAll('[data-seek-for]').forEach(button => {
    button.addEventListener('click', () => seek(get(button.dataset.seekFor), Number(button.dataset.time)));
  });
  videos.forEach(video => {
    const overlay = playButtons.find(button => button.dataset.playVideo === video.id);
    video.addEventListener('loadedmetadata', () => {
      if (pendingSeek.has(video)) {
        video.currentTime = Math.min(pendingSeek.get(video), video.duration);
        pendingSeek.delete(video);
      }
      if (video === player) video.playbackRate = Number(get('coda-speed').value);
    });
    video.addEventListener('play', () => {
      videos.forEach(other => { if (other !== video) other.pause(); });
      if (overlay) overlay.hidden = true;
    });
    video.addEventListener('pause', () => {
      if (overlay) overlay.hidden = video.currentTime > .1;
    });
  });
  const overview = get('coda-overview');
  const chapters = [...root.querySelectorAll('[data-seek-for="coda-overview"]')];
  overview.addEventListener('timeupdate', () => {
    let active = chapters[0];
    chapters.forEach(button => { if (overview.currentTime >= Number(button.dataset.time)) active = button; });
    chapters.forEach(button => button.setAttribute('aria-pressed', String(button === active)));
  });

  const tabs = root.querySelector('[data-coda-tabs]');
  const steps = [...tabs.querySelectorAll('[role="tab"]')];
  const walkthrough = root.querySelector('.coda-walkthrough');
  let stepIndex = 0;
  const showStep = button => {
    stepIndex = steps.indexOf(button);
    walkthrough.dataset.activeStep = button.dataset.step;
    steps.forEach(item => {
      const selected = item === button;
      const panel = get(item.getAttribute('aria-controls'));
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      panel.hidden = !selected;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', item.id);
      panel.tabIndex = 0;
    });
  };
  steps.forEach(button => button.addEventListener('click', () => showStep(button)));
  tabs.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const index = steps.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + steps.length) % steps.length;
    showStep(steps[next]); steps[next].focus();
  });
  get('coda-step-next').addEventListener('click', () => showStep(steps[(stepIndex + 1) % steps.length]));
  showStep(steps[0]); tabs.hidden = false;

  const format = number => Number(number.toFixed(1)).toString();
  const showPercentage = (element, value) => {
    element.textContent = format(value);
    const suffix = document.createElement('small'); suffix.textContent = '%'; element.append(suffix);
  };
  const resultControllers = new Map();
  root.querySelectorAll('[data-explorer]').forEach(explorer => {
    const select = explorer.querySelector('select[data-chart-target]');
    const libero = explorer.dataset.explorer === 'libero';
    let suite = 'overall', perturbation = 'pos', rounds = 15;
    const update = () => {
      const template = document.querySelector(`template[data-chart-target="${CSS.escape(select.dataset.chartTarget)}"][data-chart-option="${CSS.escape(select.value)}"]`);
      const rows = [...template.content.querySelectorAll('[data-value]')];
      const baseline = Number(rows[libero ? 2 : 4].dataset.value);
      const ours = Number(rows[libero && rounds === 5 ? 5 : 6].dataset.value);
      showPercentage(explorer.querySelector('[data-baseline]'), baseline);
      showPercentage(explorer.querySelector('[data-ours]'), ours);
      explorer.querySelector('[data-gain]').textContent = `${ours - baseline >= 0 ? '+' : ''}${format(ours - baseline)}`;
      const title = select.options[select.selectedIndex].textContent;
      explorer.querySelector('.coda-comparison-context').textContent = libero
        ? `${title} · ${rounds} rounds` : `${title} success · same generation budget`;
      explorer.querySelector('[data-ours-label]').textContent = libero ? `CoDA · ${rounds} rounds` : 'CoDA';
      explorer.dataset.rounds = String(rounds);
      explorer.querySelectorAll('[data-chart-pick]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.chartPick === select.value)));
      explorer.querySelectorAll('[data-suite]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.suite === suite)));
      explorer.querySelectorAll('[data-perturbation]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.perturbation === perturbation)));
      explorer.querySelectorAll('[data-rounds]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.rounds) === rounds)));
    };
    const choose = (value, resetCheckpoint = false) => {
      if (resetCheckpoint) rounds = 15;
      select.value = value;
      if (libero) [suite, perturbation] = value.split('-');
      // The shared PLAN interaction script owns rendering the authored chart templates.
      select.dispatchEvent(new Event('change', { bubbles: true }));
      update();
    };
    explorer.querySelectorAll('[data-chart-pick]').forEach(button => button.addEventListener('click', () => choose(button.dataset.chartPick)));
    explorer.querySelectorAll('[data-suite]').forEach(button => button.addEventListener('click', () => choose(`${button.dataset.suite}-${perturbation}`)));
    explorer.querySelectorAll('[data-perturbation]').forEach(button => button.addEventListener('click', () => choose(`${suite}-${button.dataset.perturbation}`)));
    explorer.querySelectorAll('button[data-rounds]').forEach(button => button.addEventListener('click', () => { rounds = Number(button.dataset.rounds); update(); }));
    select.addEventListener('change', update);
    resultControllers.set(explorer.dataset.explorer, choose);
    update();
  });
  root.querySelectorAll('[data-jump-result]').forEach(link => link.addEventListener('click', () => {
    const value = link.dataset.jumpResult;
    resultControllers.get(value === 'average' ? 'family' : 'libero')(value, true);
  }));

  const clips = [...root.querySelectorAll('[data-rollout]')];
  let current = clips[0];
  const moments = get('coda-moments');
  const renderMoments = clip => {
    moments.replaceChildren();
    JSON.parse(clip.dataset.moments).forEach(([time, label]) => {
      const button = document.createElement('button');button.type = 'button';
      button.setAttribute('data-moment', String(time));
      const timestamp = document.createElement('span');timestamp.textContent = clock(time);
      button.append(timestamp, document.createTextNode(label));
      button.addEventListener('click', () => seek(player, time));
      moments.append(button);
    });
  };
  const selectClip = (clip, shouldPlay = false) => {
    selection += 1; player.pause(); pendingSeek.delete(player); current = clip;
    clips.forEach(item => {
      if (item === clip) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });
    player.src = clip.getAttribute('href'); player.poster = clip.dataset.poster;
    get('coda-current-title').textContent = clip.dataset.title;
    get('coda-current-meta').textContent = `${clip.dataset.kind} · ${clip.dataset.duration}`;
    const counter = get('coda-clip-counter');counter.textContent = `${clip.dataset.index} `;
    const total = document.createElement('span');total.textContent = `/ ${String(clips.length).padStart(2, '0')}`;counter.append(total);
    get('coda-open-clip').href = clip.getAttribute('href');status.textContent = '';
    const overlay = playButtons.find(button => button.dataset.playVideo === player.id);
    overlay.querySelector('small').textContent = `Full trajectory · ${clip.dataset.duration}`;
    overlay.hidden = false;
    renderMoments(clip); player.load(); player.playbackRate = Number(get('coda-speed').value);
    if (shouldPlay) play(player);
  };
  clips.forEach(clip => clip.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); selectClip(clip, true);
  }));
  const advance = direction => selectClip(clips[(clips.indexOf(current) + direction + clips.length) % clips.length], true);
  get('coda-prev').addEventListener('click', () => advance(-1));
  get('coda-next').addEventListener('click', () => advance(1));
  get('coda-replay').addEventListener('click', () => seek(player, 0));
  get('coda-speed').addEventListener('change', () => { player.playbackRate = Number(get('coda-speed').value); });
  player.addEventListener('playing', () => { status.textContent = ''; });
  player.addEventListener('error', () => { status.textContent = 'This clip could not be loaded. Open the video below or choose another task.'; });
  renderMoments(current);

  const dialog = get('coda-lightbox');
  let lastFigure = null;
  root.querySelectorAll('[data-figure-zoom]').forEach(link => link.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
    event.preventDefault(); lastFigure = link;
    const original = link.querySelector('img'), enlarged = get('coda-lightbox-image');
    enlarged.src = link.getAttribute('href');enlarged.alt = original.alt;
    get('coda-lightbox-label').textContent = original.alt;
    dialog.showModal();
  }));
  get('coda-lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { if (lastFigure) lastFigure.focus(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(video => video.pause());
  });
  root.querySelectorAll('[data-coda-enhancement]').forEach(element => { element.hidden = false; });
})();
