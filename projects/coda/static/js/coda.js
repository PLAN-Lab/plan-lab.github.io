/* Progressive enhancements for CoDA; all content and media links live in HTML. */
(() => {
  'use strict';
  const root = document.querySelector('.studio-coda');
  if (!root) return;

  const tabs = root.querySelector('[data-coda-tabs]');
  if (tabs) {
    const buttons = [...tabs.querySelectorAll('[role="tab"]')];
    const showStep = button => {
      buttons.forEach(item => {
        const selected = item === button;
        const panel = document.getElementById(item.getAttribute('aria-controls'));
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        panel.hidden = !selected;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', item.id);
        panel.tabIndex = 0;
      });
    };
    tabs.addEventListener('click', event => {
      const button = event.target.closest('[role="tab"]');
      if (buttons.includes(button)) showStep(button);
    });
    tabs.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      const index = buttons.indexOf(document.activeElement);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      showStep(buttons[next]);
      buttons[next].focus();
    });
    showStep(buttons[0]);
    tabs.hidden = false;
  }

  const gallery = root.querySelector('.coda-gallery');
  if (gallery) {
    const player = document.getElementById('coda-rollout-player');
    const clips = [...gallery.querySelectorAll('[data-rollout]')];
    const category = document.getElementById('coda-category');
    const search = document.getElementById('coda-search');
    const speed = document.getElementById('coda-speed');
    const prev = document.getElementById('coda-prev');
    const next = document.getElementById('coda-next');
    const status = document.getElementById('coda-player-status');
    let current = clips[0];
    let visible = [...clips];
    let selection = 0;

    const play = () => {
      const requestedSelection = selection;
      const promise = player.play();
      if (promise) promise.catch(error => {
        if (requestedSelection === selection && error.name !== 'AbortError') {
          status.textContent = 'Use the video’s play control, or open the selected clip below.';
        }
      });
    };
    const select = (clip, shouldPlay = false) => {
      if (!clip) return;
      selection += 1;
      player.pause();
      current = clip;
      clips.forEach(item => {
        if (item === clip) item.setAttribute('aria-current', 'true');
        else item.removeAttribute('aria-current');
      });
      player.src = clip.getAttribute('href');
      player.poster = clip.dataset.poster;
      document.getElementById('coda-current-title').textContent = clip.dataset.title;
      document.getElementById('coda-current-meta').textContent =
        `${clip.dataset.duration} · ${clip.dataset.group} · Clip ${clips.indexOf(clip) + 1} of ${clips.length}`;
      document.getElementById('coda-open-clip').href = clip.getAttribute('href');
      status.textContent = '';
      player.load();
      player.playbackRate = Number(speed.value);
      if (shouldPlay) play();
    };
    clips.forEach(clip => clip.addEventListener('click', event => {
      // Preserve normal link behavior for opening a clip in another tab.
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(clip, true);
    }));
    const filter = () => {
      const query = search.value.trim().toLocaleLowerCase();
      visible = clips.filter(clip => {
        const matches = (category.value === 'all' || clip.dataset.category === category.value)
          && `${clip.dataset.title} ${clip.dataset.group}`.toLocaleLowerCase().includes(query);
        clip.hidden = !matches;
        return matches;
      });
      document.getElementById('coda-match-count').textContent = `${visible.length} of ${clips.length} rollouts`;
      document.getElementById('coda-empty').hidden = visible.length > 0;
      prev.disabled = next.disabled = visible.length < 2;
      if (!visible.length) player.pause();
      else if (!visible.includes(current)) select(visible[0]);
    };
    category.addEventListener('change', filter);
    search.addEventListener('input', filter);
    document.getElementById('coda-clear').addEventListener('click', () => {
      category.value = 'all';
      search.value = '';
      filter();
      search.focus();
    });
    const advance = direction => {
      if (!visible.length) return;
      const index = visible.indexOf(current);
      select(visible[(index + direction + visible.length) % visible.length], true);
    };
    prev.addEventListener('click', () => advance(-1));
    next.addEventListener('click', () => advance(1));
    document.getElementById('coda-replay').addEventListener('click', () => {
      player.currentTime = 0;
      play();
    });
    speed.addEventListener('change', () => { player.playbackRate = Number(speed.value); });
    player.addEventListener('loadedmetadata', () => { player.playbackRate = Number(speed.value); });
    player.addEventListener('playing', () => { status.textContent = ''; });
    player.addEventListener('error', () => {
      status.textContent = 'This clip could not be loaded. Open it below or choose another task.';
    });
  }

  // Never start media automatically; explicit playback also pauses the other player.
  const videos = [...root.querySelectorAll('video')];
  videos.forEach(video => video.addEventListener('play', () => {
    videos.forEach(other => { if (other !== video) other.pause(); });
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) videos.forEach(video => video.pause());
  });
  root.querySelectorAll('[data-coda-enhancement]').forEach(element => { element.hidden = false; });
})();
