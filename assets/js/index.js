(function () {
  function toDateValue(pub) {
    const raw = String(pub.date || '').trim();
    const parsed = raw ? Date.parse(raw) : NaN;
    if (!Number.isNaN(parsed)) return parsed;
    const year = Number(pub.year) || 0;
    if (!year) return 0;
    const fallback = Date.parse(`${year}-01-01`);
    return Number.isNaN(fallback) ? 0 : fallback;
  }

  function byDateDesc(a, b) {
    const ad = toDateValue(a);
    const bd = toDateValue(b);
    if (ad !== bd) return bd - ad;
    const ay = Number(a.year) || 0;
    const by = Number(b.year) || 0;
    if (ay !== by) return by - ay;
    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  function cardTitle(pub) {
    const project = String(pub.projectName || '').trim();
    if (project) return project;

    const title = String(pub.title || '').trim();
    if (!title) return 'Publication';

    const words = title.replace(/\s+/g, ' ').split(' ');
    const trimmed = words.slice(0, 4).join(' ');
    return words.length > 4 ? trimmed + '…' : trimmed;
  }

  function buildVidCard(pub) {
    const card = document.createElement('div');
    card.className = 'vid-card';
    card.addEventListener('click', () => {
      window.location.href = `publications.html#pub-${pub.id}`;
    });

    const inner = document.createElement('div');
    inner.className = 'vid-card-inner';
    const cardCover = pub.cardCover || pub.cover;
    if (cardCover) {
      const img = document.createElement('img');
      img.className = 'vid-card-img';
      img.alt = cardTitle(pub);
      img.decoding = 'async';
      img.loading = 'lazy';
      const tagOrientation = () => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        img.classList.add(
          img.naturalHeight > img.naturalWidth ? 'is-portrait' : 'is-landscape'
        );
      };
      img.addEventListener('load', tagOrientation);
      img.src = cardCover;
      if (img.complete) tagOrientation();
      inner.appendChild(img);
    }
    card.appendChild(inner);

    const caption = document.createElement('div');
    caption.className = 'vid-card-caption';
    const box = document.createElement('div');
    box.className = 'caption-box';
    const h3 = document.createElement('h3');
    h3.textContent = cardTitle(pub);
    const p = document.createElement('p');
    p.textContent = window.PLANContent.formatVenue(pub.venue, pub.year, pub.venueAbbr);
    box.appendChild(h3);
    box.appendChild(p);
    caption.appendChild(box);
    card.appendChild(caption);

    return card;
  }

  function buildTeamCard(member) {
    const a = document.createElement('a');
    a.className = 'team-card' + (member.group === 'alumni' ? ' is-alumni' : '');
    a.href = window.PLANContent.memberProfileUrl(member);

    const img = document.createElement('img');
    img.className = 'avatar-img';
    img.alt = member.name || 'Team member';
    if (member.avatar) img.src = member.avatar;
    img.loading = 'lazy';
    img.decoding = 'async';

    const h3 = document.createElement('h3');
    h3.textContent = window.PLANContent.formatMemberName(member, 'Unnamed');

    const p1 = document.createElement('p');
    if (member.group === 'alumni') {
      p1.textContent = (member.title && member.title[0]) || member.role || 'Alumni';
    } else {
      p1.textContent = member.role || '';
    }

    a.appendChild(img);
    a.appendChild(h3);
    if (p1.textContent) a.appendChild(p1);

    const p2Text =
      member.group === 'alumni'
        ? String(member.currently || '').trim()
        : '';
    if (p2Text) {
      const p2 = document.createElement('p');
      p2.style.fontSize = '0.8rem';
      p2.textContent = p2Text;
      a.appendChild(p2);
    }

    return a;
  }

  async function renderRecentWork() {
	    const track = document.querySelector('.track-cards');
	    if (!track || !window.PLANContent) return;

	    const viewAll = track.querySelector('.view-all-wrapper');
	    if (!viewAll) return;

	    track.querySelectorAll('.vid-card').forEach((n) => n.remove());

	    const pubs = (await window.PLANContent.getPublications()).slice().sort(byDateDesc);
	    const pubById = new Map(pubs.map((p) => [p.id, p]));
	    const featuredIds = [
	      '2026-Shen-phantom-latent-physics-video', // PHANTOM
	      '2025-Liu-palm-progress-aware', // PALM
	      '2026-Susladkar-best-of-both-worlds-unidflow', // UniDFlow
	      '2026-Yu-dreampartgen-semantically-grounded-part', // DreamPartGen
	    ];

	    const featured = featuredIds.map((id) => pubById.get(id)).filter(Boolean);
	    const top = featured.length
	      ? featured
	      : pubs
	          .filter((p) => p.id !== '2025-Shen-learning-by-asking-for-embodie')
	          .slice(0, 5);

	    top.forEach((pub) => {
	      track.insertBefore(buildVidCard(pub), viewAll);
	    });

    if (typeof window.PLAN_setupHorizontalScroll === 'function') {
      window.PLAN_setupHorizontalScroll(true);
    }
  }

  function newsDetailUrl(item) {
    return `news.html?id=${encodeURIComponent(item.id || '')}`;
  }

  function newsMoreHref(item) {
    // An explicit link always wins; otherwise the item's detail page.
    return item.link || newsDetailUrl(item);
  }

  function toPlaceholder(media, item) {
    media.innerHTML = '';
    media.classList.add('is-placeholder');
    const icon = document.createElement('i');
    icon.className = item.icon || 'fa-solid fa-bullhorn';
    icon.setAttribute('aria-hidden', 'true');
    media.appendChild(icon);
  }

  function buildNewsCard(item, covers) {
    const href = newsMoreHref(item);
    const isExternal = /^https?:\/\//i.test(href);

    const a = document.createElement('a');
    a.className = 'news-card';
    a.href = href;
    if (isExternal) {
      a.target = '_blank';
      a.rel = 'noreferrer';
    }

    const media = document.createElement('div');
    media.className = 'news-card-media';
    // Homepage cards prefer a conference banner/logo (cropped to fill);
    // otherwise the first paper cover renders publication-style (contained).
    const banner = item.cardImage || item.banner;
    const fallback = (covers && covers.length ? covers[0] : null) || item.image;
    const mediaSrc = banner || fallback;
    if (item.imageFit === 'cover') media.classList.add('fit-cover');
    if (mediaSrc) {
      const img = document.createElement('img');
      img.src = mediaSrc;
      img.alt = item.title || 'PLAN Lab news';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = function () {
        if (fallback && img.src.indexOf(fallback) === -1) {
          img.src = fallback; // banner file missing: fall back to the paper cover
        } else {
          toPlaceholder(media, item);
        }
      };
      media.appendChild(img);
    } else {
      toPlaceholder(media, item);
    }
    a.appendChild(media);

    const body = document.createElement('div');
    body.className = 'news-card-body';
    const h3 = document.createElement('h3');
    h3.textContent = item.title || 'PLAN Lab news';
    const p = document.createElement('p');
    p.textContent = String(item.description || '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1');
    body.appendChild(h3);
    body.appendChild(p);
    a.appendChild(body);

    const foot = document.createElement('div');
    foot.className = 'news-card-foot';
    const time = document.createElement('span');
    time.className = 'news-card-date';
    time.textContent = window.PLANContent.formatNewsDate(item.date);
    const more = document.createElement('span');
    more.className = 'news-card-more';
    more.innerHTML = 'More <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    foot.appendChild(time);
    foot.appendChild(more);
    a.appendChild(foot);

    return a;
  }

  async function renderNews() {
    const grid = document.getElementById('news-grid');
    if (!grid || !window.PLANContent) return;

    const [items, pubs] = await Promise.all([
      window.PLANContent.getNews(),
      window.PLANContent.getPublications().catch(() => []),
    ]);
    const pubById = new Map(pubs.map((p) => [p.id, p]));
    grid.innerHTML = '';
    items.slice(0, 3).forEach((item) => {
      const covers = window.PLANContent.resolveNewsCovers(item, pubById);
      grid.appendChild(buildNewsCard(item, covers));
    });

    if (window.ScrollTrigger) {
      try { ScrollTrigger.refresh(); } catch (e) { /* not registered yet */ }
    }
  }

  async function renderTeam() {
    if (!window.PLANContent) return;

    const piGrid = document.getElementById('team-pi-grid');
    const currentGrid = document.getElementById('team-current-grid');
    const alumniGrid = document.getElementById('team-alumni-grid');
    if (!piGrid || !currentGrid || !alumniGrid) return;

    const members = await window.PLANContent.getTeam();
    const pi = members.filter((m) => m.group === 'pi');
    const phd = members.filter((m) => m.group === 'phd');
    const masters = members.filter((m) => m.group === 'masters');
    const undergrad = members.filter((m) => m.group === 'undergrad');
    const alumni = members.filter((m) => m.group === 'alumni');

    piGrid.innerHTML = '';
    currentGrid.innerHTML = '';
    alumniGrid.innerHTML = '';

    pi.forEach((m) => piGrid.appendChild(buildTeamCard(m)));
    [...phd, ...masters, ...undergrad].forEach((m) => currentGrid.appendChild(buildTeamCard(m)));
    alumni.forEach((m) => alumniGrid.appendChild(buildTeamCard(m)));
  }

  const sectionState = {
    publications: false,
    news: false,
    team: false,
  };

  const sectionLoaders = {
    publications: renderRecentWork,
    news: renderNews,
    team: renderTeam,
  };

  async function loadSection(sectionId) {
    const id = String(sectionId || '').trim();
    const loader = sectionLoaders[id];
    if (!loader) return;
    if (sectionState[id]) return;
    sectionState[id] = true;
    try {
      await loader();
    } catch (e) {
      console.error(e);
    }
  }

  // Anchor navigation. The team grid and the horizontal card track render
  // lazily and grow the page when they load. A plain jump to #partners or
  // #contact lands first, then the sections above it inflate, and the
  // viewport ends up on #team instead. So: load everything that changes
  // layout above the target, let it settle, then scroll.
  async function ensureLayoutSections() {
    await loadSection('news');
    await loadSection('publications');
    await loadSection('team');
  }

  function afterLayout() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });
  }

  async function scrollToHash(hash, smooth) {
    const id = String(hash || '').replace(/^#/, '').trim();
    if (!id) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    await ensureLayoutSections();
    await afterLayout();
    if (window.ScrollTrigger) {
      try { ScrollTrigger.refresh(); } catch (e) { /* not registered yet */ }
    }
    el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    return true;
  }

  function setupAnchorNavigation() {
    document.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const m = href.match(/^(?:index\.html)?#([A-Za-z0-9_-]+)$/);
      if (!m) return;
      if (!document.getElementById(m[1])) return;
      e.preventDefault();
      if (window.location.hash !== '#' + m[1]) {
        history.pushState(null, '', '#' + m[1]);
      }
      scrollToHash(m[1], true);
    });
  }

  function hashToSectionId(hash) {
    const raw = String(hash || '').replace(/^#/, '').trim();
    if (!raw) return '';
    if (raw === 'team' || raw.startsWith('team-')) return 'team';
    if (raw === 'news' || raw.startsWith('news-')) return 'news';
    if (raw === 'publications' || raw.startsWith('publications-')) return 'publications';
    return sectionLoaders[raw] ? raw : '';
  }

  function setupSectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target && entry.target.id ? entry.target.id : '';
          if (!id) return;
          const sectionId = hashToSectionId(id);
          if (sectionId) loadSection(sectionId);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '250px 0px', threshold: 0.01 }
    );

    Object.keys(sectionLoaders).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  async function init() {
    try {
      setupAnchorNavigation();
      setupSectionObserver();

      if (window.location.hash) {
        await scrollToHash(window.location.hash, false);
        // Correct once more after images and fonts finish loading.
        window.addEventListener('load', () => {
          scrollToHash(window.location.hash, false);
        }, { once: true });
      }

      window.addEventListener('hashchange', () => {
        scrollToHash(window.location.hash, false);
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
