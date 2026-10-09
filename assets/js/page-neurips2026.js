/* The page, paper details, previews, citations, and schedule are static HTML.
   JavaScript connects paper selection, filtering, calendars, and copy controls. */
(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.conference-paper')];
  const allCards = [...cards, document.querySelector('.workshop-paper')];
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
    const offset = document.querySelector('.glass-nav').getBoundingClientRect().height + 18;
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
    if (card.classList.contains('workshop-paper')) { scrollTo(document.getElementById('workshops')); return; }
    if (!matches().includes(card)) { search.value = '';session.value = 'All Sessions'; }
    activeId = id;refresh();
    if (hash) history.replaceState(null, '', '#' + encodeURIComponent(id));
    if (scroll) scrollTo(document.getElementById('detailPanel'));
  }
  function step(offset) {
    const items = matches();if (!items.length) return;
    const index = items.findIndex(card => card.dataset.paperId === activeId);
    select(items[(index + offset + items.length) % items.length].dataset.paperId);
  }
  buttons.forEach(button => button.addEventListener('click', () => {
    select(button.dataset.paper, { scroll: matchMedia('(max-width: 900px)').matches });
  }));
  document.querySelectorAll('[data-paperlink]').forEach(button => {
    button.addEventListener('click', () => select(button.dataset.paperlink, { scroll: true }));
  });
  document.querySelector('[data-prev]').addEventListener('click', () => step(-1));
  document.querySelector('[data-next]').addEventListener('click', () => step(1));
  search.addEventListener('input', refresh);session.addEventListener('change', refresh);
  document.getElementById('timeline').addEventListener('keydown', event => {
    if (event.target.closest('input,select,textarea') || !['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(event.key)) return;
    event.preventDefault();step(['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1);
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
        const range = document.createRange();range.selectNodeContents(citation);
        const selection = window.getSelection();selection.removeAllRanges();selection.addRange(range);
        button.textContent = 'Citation selected';
      }
      setTimeout(() => { button.innerHTML = label; }, 1800);
    });
  });

  const BASE = 'https://plan-lab.github.io/';
  const calendarPath = id => 'assets/data/neurips2026-calendar/' + encodeURIComponent(id) + '.ics';
  const stamp = iso => iso.replace(/[-:]/g, '');
  function calendarOptions(id) {
    if (id === 'all') {
      const path = 'assets/data/planlab_neurips2026_schedule.ics';
      const url = BASE + path, webcal = url.replace('https:', 'webcal:');
      return [
        ['Google Calendar', 'https://www.google.com/calendar/render?cid=' + encodeURIComponent(webcal), true],
        ['Outlook 365', 'https://outlook.office.com/calendar/addcalendar?url=' + encodeURIComponent(url) + '&name=' + encodeURIComponent('PLAN Lab NeurIPS 2026 Atlanta Posters'), true],
        ['Apple / iCal', webcal], ['Download .ics', path, false, true]
      ];
    }
    const card = byId.get(id);if (!card) return [];
    const data = card.dataset, workshop = card.classList.contains('workshop-paper');
    const paper = card.querySelector('h2,h3').textContent.trim();
    const title = workshop ? data.session + ' workshop (LIBERO-MAX coauthor paper)' : 'PLAN Lab @ NeurIPS 2026: ' + data.short + ' Poster';
    const note = workshop ? '\nFull workshop hours only; the individual paper’s presentation time is not listed.' : '';
    const details = paper + '\n\n' + data.session + note + '\nOfficial NeurIPS page: ' + data.officialUrl;
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
  window.addEventListener('scroll', positionPopup, { passive: true });
  const nav = document.querySelector('.glass-nav');
  const syncNav = () => nav.classList.toggle('scrolled-nav', scrollY > 20);
  window.addEventListener('scroll', syncNav, { passive: true });syncNav();
})();
