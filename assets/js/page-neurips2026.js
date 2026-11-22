/* The page, paper details, previews, citations, and schedule are static HTML.
   JavaScript connects paper selection, filtering, calendars, and copy controls. */
(() => {
  'use strict';
    function cubeSvg(id, variant = 'blue') {
      const c = variant === 'orange'
        ? { topA:'#ff8a18', topB:'#ff5f05', leftA:'#cc4700', leftB:'#ff6d00', rightA:'#f05a00', rightB:'#b93b00', stroke:'#ffb06a' }
        : { topA:'#5f80a8', topB:'#355d88', leftA:'#1c3154', leftB:'#355d88', rightA:'#2b4d73', rightB:'#14294b', stroke:'#88a6c8' };
      return `<svg class="cube-svg" viewBox="0 0 96 96" aria-hidden="true"><defs><linearGradient id="cubeTop-${id}-${variant}" x1="18" y1="8" x2="78" y2="42" gradientUnits="userSpaceOnUse"><stop stop-color="${c.topA}"/><stop offset="1" stop-color="${c.topB}"/></linearGradient><linearGradient id="cubeLeft-${id}-${variant}" x1="15" y1="28" x2="50" y2="82" gradientUnits="userSpaceOnUse"><stop stop-color="${c.leftA}"/><stop offset="1" stop-color="${c.leftB}"/></linearGradient><linearGradient id="cubeRight-${id}-${variant}" x1="82" y1="28" x2="48" y2="82" gradientUnits="userSpaceOnUse"><stop stop-color="${c.rightA}"/><stop offset="1" stop-color="${c.rightB}"/></linearGradient><filter id="cubeShadow-${id}-${variant}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="7" flood-color="#13294B" flood-opacity="0.24"/></filter></defs><ellipse cx="48" cy="82" rx="29" ry="8" fill="#13294B" opacity="0.13"/><g filter="url(#cubeShadow-${id}-${variant})"><polygon points="48,8 82,27 48,46 14,27" fill="url(#cubeTop-${id}-${variant})"/><polygon points="14,27 48,46 48,83 14,63" fill="url(#cubeLeft-${id}-${variant})"/><polygon points="82,27 48,46 48,83 82,63" fill="url(#cubeRight-${id}-${variant})"/><path d="M48 8 L82 27 L48 46 L14 27 Z" fill="none" stroke="${c.stroke}" stroke-opacity="0.55" stroke-width="1.3"/><path d="M14 27 L48 46 L82 27 M48 46 L48 83" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.2"/><path d="M25 28 L48 16 L72 29" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.4" stroke-linecap="round"/></g></svg>`;
    }


  [['hero-main-cube','orange'],['hero-small-cube-a','blue'],['hero-small-cube-b','orange']].forEach(([id,color]) => { document.getElementById(id).innerHTML = cubeSvg(id,color); });

  const cards = [...document.querySelectorAll('.conference-paper')];
  const allCards = cards;
  const buttons = [...document.querySelectorAll('[data-paper]')];
  const search = document.getElementById('searchInput');
  const session = document.getElementById('sessionFilter');
  const byId = new Map(allCards.map(card => [card.dataset.paperId, card]));
  let activeId = cards[0].dataset.paperId;
  const matches = () => cards.filter(card =>
    (session.value === 'All Sessions' || card.dataset.session === session.value) &&
    card.dataset.search.toLowerCase().includes(search.value.trim().toLowerCase())
  );
  const scrollTo = target => {
    const offset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-offset')) || 0;
    const top = target.getBoundingClientRect().top + scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  function refresh() {
    const items = matches();
    if (!items.some(card => card.dataset.paperId === activeId) && items.length) activeId = items[0].dataset.paperId;
    buttons.forEach(button => {
      const visible = items.some(card => card.dataset.paperId === button.dataset.paper);
      const active = visible && button.dataset.paper === activeId;
      button.hidden = !visible;
      button.classList.toggle('active', active);
      const shape = button.querySelector('[data-cube]');
      if (shape) shape.innerHTML = cubeSvg(button.dataset.paper, active ? 'orange' : 'blue');
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.day-separator').forEach(separator => {
      separator.hidden = !buttons.some(button => !button.hidden && button.dataset.date === separator.dataset.date);
    });
    cards.forEach(card => { card.hidden = !items.includes(card) || card.dataset.paperId !== activeId; });
    document.getElementById('no-results').hidden = items.length > 0;
    document.getElementById('detailPanel').hidden = !items.length;
    document.querySelector('.poster-grid').dataset.empty = String(!items.length);
    document.querySelectorAll('[data-prev],[data-next]').forEach(button => { button.disabled = items.length < 2; });
  }
  function select(id, { scroll = false, hash = true } = {}) {
    const card = byId.get(id);
    if (!card) return;
    if (!matches().includes(card)) { search.value = '';session.value = 'All Sessions'; }
    activeId = id;refresh();
    if (hash) history.replaceState(null, '', '#' + encodeURIComponent(id));
    card.scrollTop = 0;
    if (scroll) scrollTo(document.getElementById(matchMedia('(min-width: 1000px)').matches ? 'timeline' : 'detailPanel'));
  }
  function step(offset) {
    const items = matches();if (!items.length) return;
    const index = items.findIndex(card => card.dataset.paperId === activeId);
    select(items[(index + offset + items.length) % items.length].dataset.paperId);
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    select(button.dataset.paper, { scroll: matchMedia('(max-width: 999px)').matches });
  }));
  document.querySelectorAll('[data-paperlink]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      select(button.dataset.paperlink, { scroll: true });
    });
  });
  document.querySelector('[data-prev]').addEventListener('click', () => step(-1));
  document.querySelector('[data-next]').addEventListener('click', () => step(1));
  search.addEventListener('input', refresh);session.addEventListener('change', refresh);
  document.getElementById('timeline').addEventListener('keydown', event => {
    if (!event.target.closest('[data-paper]') || !['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(event.key)) return;
    event.preventDefault();step(['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1);
    buttons.find(button => button.dataset.paper === activeId)?.focus();
  });
  function applyHash() {
    try {
      const id = decodeURIComponent(location.hash.slice(1)).toLowerCase();
      if (byId.has(id)) select(id, { hash: false, scroll: true });
    } catch { /* A malformed fragment leaves the default paper visible. */ }
  }
  refresh();applyHash();window.addEventListener('hashchange', applyHash);

  document.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      const citation = byId.get(button.dataset.copy).querySelector('.bibtex-pre');
      const label = button.innerHTML;
      try {
        await navigator.clipboard.writeText(citation.textContent);
        button.textContent = 'Copied';
      } catch {
        citation.closest('details').open = true;
        const range = document.createRange();range.selectNodeContents(citation);
        const selection = window.getSelection();selection.removeAllRanges();selection.addRange(range);
        button.textContent = 'Citation selected';
      }
      setTimeout(() => { button.innerHTML = label; }, 1800);
    });
  });

  const calendarPath = id => 'assets/data/neurips2026-calendar/' + encodeURIComponent(id) + '.ics';
  const stamp = iso => iso.replace(/[-:]/g, '');
  function calendarOptions(id) {
    if (id === 'all') {
      const path = 'assets/data/planlab_neurips2026_schedule.ics';
      const url = new URL(path, 'https://plan-lab.github.io/').href;
      const webcal = url.replace(/^https?:/, 'webcal:');
      return [
        ['Google Calendar', 'https://www.google.com/calendar/render?cid=' + encodeURIComponent(webcal), true],
        ['Outlook 365', 'https://outlook.office.com/calendar/addcalendar?url=' + encodeURIComponent(url) + '&name=' + encodeURIComponent('PLAN Lab NeurIPS 2026'), true],
        ['Apple / iCal', webcal],
        ['Download .ics', path, false, true]
      ];
    }
    const card = byId.get(id);if (!card || !card.dataset.startUtc || !card.dataset.endUtc) return [];
    const data = card.dataset;
    const paper = card.querySelector('h2,h3').textContent.trim();
    const title = data.calendarTitle || 'PLAN Lab @ NeurIPS 2026: ' + data.short + ' Poster';
    const details = paper + '\n\n' + (data.calendarDescription || data.session) + '\nOfficial NeurIPS page: ' + data.officialUrl;
    const google = new URL('https://calendar.google.com/calendar/render');
    google.search = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: stamp(data.startUtc) + '/' + stamp(data.endUtc), ctz: data.timezone, details, location: data.location });
    const outlook = new URL('https://outlook.office.com/calendar/0/deeplink/compose');
    outlook.search = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: title, startdt: data.startUtc, enddt: data.endUtc, allday: 'false', body: details, location: data.location });
    return [['Google Calendar', google.href, true], ['Outlook 365', outlook.href, true], ['Apple / iCal', calendarPath(id)], ['Download .ics', calendarPath(id), false, true]];
  }
  const popup = document.createElement('div');
  popup.id = 'calendarPopup';popup.className = 'calendar-popup';popup.hidden = true;
  popup.setAttribute('role', 'dialog');popup.setAttribute('aria-label', 'Calendar options');
  document.body.append(popup);
  let trigger = null;
  function positionPopup() {
    if (popup.hidden || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const left = Math.max(12, Math.min(rect.left, innerWidth - popup.offsetWidth - 12));
    const below = rect.bottom + 8;
    const top = below + popup.offsetHeight < innerHeight - 12 ? below : Math.max(12, rect.top - popup.offsetHeight - 8);
    popup.style.left = left + 'px';popup.style.top = top + 'px';
  }
  function closePopup(focus = false) {
    popup.hidden = true;
    if (trigger) { trigger.setAttribute('aria-expanded', 'false');if (focus) trigger.focus(); }
    trigger = null;
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('.calendar-trigger');
    if (button) {
      if (button === trigger && !popup.hidden) { closePopup();return; }
      closePopup();trigger = button;button.setAttribute('aria-expanded', 'true');button.setAttribute('aria-controls', popup.id);
      popup.replaceChildren(...calendarOptions(button.dataset.calendarId).map(([label, href, external, download]) => {
        const link = document.createElement('a');link.textContent = label;link.href = href;
        if (external) { link.target = '_blank';link.rel = 'noopener'; }
        if (download) link.setAttribute('download', '');
        if (href.endsWith('.ics')) link.type = 'text/calendar';
        return link;
      }));
      popup.hidden = false;positionPopup();popup.querySelector('a')?.focus({ preventScroll: true });
    } else if (event.target.closest('#calendarPopup a')) closePopup();
    else if (!event.target.closest('#calendarPopup')) closePopup();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closePopup(true); });
  window.addEventListener('resize', positionPopup, { passive: true });
  window.addEventListener('scroll', positionPopup, { passive: true, capture: true });
  const nav = document.querySelector('.glass-nav');
  const syncNav = () => nav.classList.toggle('scrolled-nav', scrollY > 20);
  window.addEventListener('scroll', syncNav, { passive: true });syncNav();
})();

