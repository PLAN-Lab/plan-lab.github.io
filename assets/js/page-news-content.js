(function () {
  function isExternal(url) {
    return /^https?:\/\//i.test(String(url || ''));
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Minimal [text](url) link support inside descriptions/body.
  // Everything is HTML-escaped first; only the link syntax becomes markup.
  function richTextHtml(text) {
    const escaped = escapeHtml(String(text || ''));
    return escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) => {
      const ext = /^https?:\/\//i.test(url);
      const attrs = ext ? ' target="_blank" rel="noreferrer"' : '';
      return `<a class="news-inline-link" href="${url}"${attrs}>${label}</a>`;
    });
  }

  function detailUrl(item) {
    return `news.html?id=${encodeURIComponent(item.id || '')}`;
  }

  function moreHref(item) {
    // An explicit link always wins; otherwise the item's detail page.
    return item.link || detailUrl(item);
  }

  function moreLabel(item) {
    if (item.link && item.linkLabel) return String(item.linkLabel);
    return 'More';
  }

  // --- Lab member author linking (same conventions as the publications page) ---

  let labMemberByName = new Map();

  function normalizeName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function splitAuthorMarker(name) {
    const raw = String(name || '').trim();
    const m = raw.match(/^(.*?)\s*([*^\u2020\u2021]+)$/);
    if (m && m[1].trim()) return { base: m[1].trim(), mark: m[2] };
    return { base: raw, mark: '' };
  }

  async function buildMemberMap() {
    try {
      const members = await window.PLANContent.getTeam();
      members.forEach((member) => {
        const profileUrl = window.PLANContent.memberProfileUrl(member);
        const names = [member.name].concat(Array.isArray(member.aliases) ? member.aliases : []);
        names.forEach((n) => {
          const key = normalizeName(n);
          if (key && !labMemberByName.has(key)) {
            labMemberByName.set(key, { profileUrl });
          }
        });
      });
    } catch (e) {
      console.error(e);
    }
  }

  function buildAuthorsHtml(authors) {
    const list = Array.isArray(authors) ? authors : [];
    const highlightedAuthors = new Set(['yuanzhe liu', 'xingyou liu']);
    const parts = list.map((a) => {
      const raw = String(a || '').trim();
      if (!raw) return '';
      const { base, mark } = splitAuthorMarker(raw);
      const key = normalizeName(base);
      const sup = mark ? `<sup class="pub-author-mark">${escapeHtml(mark)}</sup>` : '';
      const member = labMemberByName.get(key);
      if (member && member.profileUrl) {
        return `<a class="pub-author-lab" href="${escapeHtml(member.profileUrl)}">${escapeHtml(base)}</a>${sup}`;
      }
      if (highlightedAuthors.has(key)) {
        return `<span class="pub-author-lab">${escapeHtml(base)}</span>${sup}`;
      }
      return `${escapeHtml(base)}${sup}`;
    });
    return parts.filter(Boolean).join(', ');
  }

  // --- Shared media block ---

  function buildMedia(item, className) {
    const media = document.createElement('div');
    media.className = className;
    if (item.imageFit === 'cover') media.classList.add('fit-cover');
    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title || 'PLAN Lab news';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
    } else {
      media.classList.add('is-placeholder');
      const icon = document.createElement('i');
      icon.className = item.icon || 'fa-solid fa-bullhorn';
      icon.setAttribute('aria-hidden', 'true');
      media.appendChild(icon);
    }
    return media;
  }

  function makeLinkButton(href, label, className, iconClass) {
    const a = document.createElement('a');
    a.className = className;
    a.href = href;
    if (isExternal(href)) {
      a.target = '_blank';
      a.rel = 'noreferrer';
    }
    if (iconClass) {
      const icon = document.createElement('i');
      icon.className = iconClass;
      icon.setAttribute('aria-hidden', 'true');
      icon.style.marginRight = '8px';
      a.appendChild(icon);
    }
    a.appendChild(document.createTextNode(label));
    return a;
  }

  // --- Archive (default) view ---

  function buildArchiveMedia(item, covers) {
    const media = document.createElement('div');
    media.className = 'news-list-media';

    const sources = (covers && covers.length ? covers : (item.image ? [item.image] : []));
    if (!sources.length) {
      media.classList.add('is-placeholder');
      const icon = document.createElement('i');
      icon.className = item.icon || 'fa-solid fa-bullhorn';
      icon.setAttribute('aria-hidden', 'true');
      media.appendChild(icon);
      return media;
    }

    const imgs = sources.map((src, i) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = item.title || 'PLAN Lab news';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className = 'news-carousel-img' + (i === 0 ? ' is-active' : '');
      media.appendChild(img);
      return img;
    });

    if (sources.length > 1) {
      media.classList.add('is-carousel');
      const dots = document.createElement('div');
      dots.className = 'news-carousel-dots';
      const dotEls = sources.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'news-carousel-dot' + (i === 0 ? ' is-active' : '');
        b.setAttribute('aria-label', `Image ${i + 1}`);
        dots.appendChild(b);
        return b;
      });
      media.appendChild(dots);

      let current = 0;
      let timer = null;
      const show = (idx) => {
        imgs[current].classList.remove('is-active');
        dotEls[current].classList.remove('is-active');
        current = (idx + imgs.length) % imgs.length;
        imgs[current].classList.add('is-active');
        dotEls[current].classList.add('is-active');
      };
      const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const start = () => { if (!timer && !reduceMotion) timer = setInterval(() => show(current + 1), 3500); };
      const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
      dotEls.forEach((b, i) => b.addEventListener('click', (e) => { e.preventDefault(); show(i); }));
      media.addEventListener('mouseenter', stop);
      media.addEventListener('mouseleave', start);
      start();
    }

    return media;
  }

  function buildArchiveItem(item, covers) {
    const article = document.createElement('article');
    article.className = 'news-list-item';
    if (item.id) article.id = `news-${item.id}`;

    article.appendChild(buildArchiveMedia(item, covers));

    const content = document.createElement('div');
    content.className = 'news-list-content';

    const h3 = document.createElement('h3');
    h3.textContent = item.title || 'PLAN Lab news';
    content.appendChild(h3);

    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'news-item-desc';
      desc.innerHTML = richTextHtml(item.description);
      content.appendChild(desc);
    }

    const foot = document.createElement('div');
    foot.className = 'news-item-foot';

    const date = document.createElement('span');
    date.className = 'news-item-date';
    date.textContent = window.PLANContent.formatNewsDate(item.date);
    foot.appendChild(date);

    const href = moreHref(item);
    const a = document.createElement('a');
    a.className = 'news-item-link';
    a.href = href;
    if (isExternal(href)) {
      a.target = '_blank';
      a.rel = 'noreferrer';
    }
    a.innerHTML = escapeHtml(moreLabel(item)) +
      ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    foot.appendChild(a);

    content.appendChild(foot);
    article.appendChild(content);
    return article;
  }

  function itemYear(item) {
    const raw = String((item && item.date) || '').trim();
    const y = raw.split('-')[0];
    return /^\d{4}$/.test(y) ? y : 'Earlier';
  }

  function scrollToHashTarget() {
    const hash = String(window.location.hash || '').replace(/^#/, '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function renderArchive(list, items) {
    let pubById = new Map();
    try {
      const pubs = await window.PLANContent.getPublications();
      pubById = new Map(pubs.map((p) => [p.id, p]));
    } catch (e) {
      console.error(e);
    }

    function itemCovers(item) {
      const entries = Array.isArray(item.papers) ? item.papers : [];
      const covers = entries
        .map((entry) => resolvePaper(entry, pubById))
        .filter(Boolean)
        .map((paper) => paper.cover)
        .filter(Boolean);
      return [...new Set(covers)];
    }

    let currentYear = null;
    let group = null;
    items.forEach((item) => {
      const year = itemYear(item);
      if (year !== currentYear) {
        currentYear = year;
        group = document.createElement('div');
        group.className = 'news-year-group';
        const h2 = document.createElement('h2');
        h2.className = 'news-year-title';
        h2.textContent = year;
        group.appendChild(h2);
        list.appendChild(group);
      }
      group.appendChild(buildArchiveItem(item, itemCovers(item)));
    });

    scrollToHashTarget();
    window.addEventListener('hashchange', scrollToHashTarget);
  }

  // --- Detail view (news.html?id=...) ---

  function resolvePaper(entry, pubById) {
    if (!entry) return null;
    if (typeof entry === 'string') return pubById.get(entry) || null;
    if (entry.pubId) {
      const pub = pubById.get(entry.pubId);
      if (!pub) {
        console.warn('[PLAN news] Unknown pubId in news.json:', entry.pubId);
        return null;
      }
      // Allow the news entry to add a note on top of the publication record.
      return entry.note ? Object.assign({}, pub, { newsNote: entry.note }) : pub;
    }
    return entry; // inline paper object
  }

  function buildPaperCard(paper) {
    const card = document.createElement('article');
    card.className = 'news-paper-card';

    const media = document.createElement('div');
    media.className = 'news-paper-media';
    if (paper.cover) {
      const img = document.createElement('img');
      img.src = paper.cover;
      img.alt = paper.projectName ? `${paper.projectName} cover` : 'Paper cover';
      img.loading = 'lazy';
      img.decoding = 'async';
      media.appendChild(img);
    } else {
      media.classList.add('is-placeholder');
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-file-lines';
      icon.setAttribute('aria-hidden', 'true');
      media.appendChild(icon);
    }
    card.appendChild(media);

    const content = document.createElement('div');
    content.className = 'news-paper-content';

    const venueText = window.PLANContent.formatVenue(paper.venue, paper.year, paper.venueAbbr);
    if (venueText) {
      const venue = document.createElement('div');
      venue.className = 'pub-venue';
      venue.textContent = venueText;
      content.appendChild(venue);
    }

    const paperUrl = window.PLANContent.resolveUrl(paper.links && paper.links.paper) ||
      window.PLANContent.doiToUrl(paper.doi);
    const projectUrl = window.PLANContent.resolveUrl(paper.links && paper.links.website);
    const codeUrl = window.PLANContent.resolveUrl(paper.links && paper.links.code);
    const primaryUrl = projectUrl || paperUrl;

    const title = document.createElement('h3');
    title.className = 'news-paper-title';
    const titleText = paper.title || paper.projectName || 'Untitled';
    if (primaryUrl) {
      const a = document.createElement('a');
      a.href = primaryUrl;
      if (isExternal(primaryUrl)) {
        a.target = '_blank';
        a.rel = 'noreferrer';
      }
      a.textContent = titleText;
      title.appendChild(a);
    } else {
      title.textContent = titleText;
    }
    content.appendChild(title);

    const authorsHtml = buildAuthorsHtml(paper.authors);
    if (authorsHtml) {
      const authors = document.createElement('p');
      authors.className = 'pub-authors';
      authors.innerHTML = authorsHtml;
      content.appendChild(authors);
    }

    const noteText = String(paper.newsNote || paper.note || '').trim();
    if (noteText && !paper.notemark) {
      const note = document.createElement('p');
      note.className = 'news-paper-note';
      note.textContent = noteText;
      content.appendChild(note);
    }

    const links = document.createElement('div');
    links.className = 'pub-links';
    if (paperUrl) links.appendChild(makeLinkButton(paperUrl, 'Paper', 'btn-outline', 'fa-solid fa-file-pdf'));
    if (projectUrl) links.appendChild(makeLinkButton(projectUrl, 'Project', 'btn-primary', 'fa-solid fa-link'));
    if (codeUrl) links.appendChild(makeLinkButton(codeUrl, 'Code', 'btn-outline', 'fa-brands fa-github'));
    if (links.childNodes.length) content.appendChild(links);

    card.appendChild(content);
    return card;
  }

  async function renderDetail(list, item) {
    // Page header carries the news title, like a standalone article page.
    const header = document.querySelector('.page-header');
    if (header) {
      header.classList.add('is-detail');
      const h1 = header.querySelector('h1');
      if (h1) h1.textContent = item.title || 'News';
      const p = header.querySelector('p');
      if (p) p.textContent = window.PLANContent.formatNewsDate(item.date);
    }
    document.title = `${item.title || 'News'} | PLAN Lab`;

    const back = document.createElement('a');
    back.className = 'news-back-link';
    back.href = 'news.html';
    back.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All News';
    list.appendChild(back);

    const lede = document.createElement('div');
    lede.className = 'news-detail-lede';
    if (item.description) {
      const desc = document.createElement('p');
      desc.className = 'news-item-desc';
      desc.innerHTML = richTextHtml(item.description);
      lede.appendChild(desc);
    }
    const body = item.body;
    const paragraphs = Array.isArray(body) ? body : (body ? [body] : []);
    paragraphs.forEach((text) => {
      const p = document.createElement('p');
      p.className = 'news-item-extra';
      p.innerHTML = richTextHtml(text);
      lede.appendChild(p);
    });
    if (item.link) {
      const actions = document.createElement('div');
      actions.className = 'news-detail-actions';
      actions.appendChild(makeLinkButton(
        item.link,
        item.linkLabel || 'Learn more',
        'btn-primary',
        isExternal(item.link) ? 'fa-solid fa-arrow-up-right-from-square' : 'fa-solid fa-link'
      ));
      lede.appendChild(actions);
    }
    if (lede.childNodes.length) list.appendChild(lede);

    const paperEntries = Array.isArray(item.papers) ? item.papers : [];
    if (paperEntries.length) {
      let pubById = new Map();
      try {
        const pubs = await window.PLANContent.getPublications();
        pubById = new Map(pubs.map((p) => [p.id, p]));
      } catch (e) {
        console.error(e);
      }
      await buildMemberMap();

      const papers = paperEntries.map((entry) => resolvePaper(entry, pubById)).filter(Boolean);
      if (papers.length) {
        const heading = document.createElement('h2');
        heading.className = 'news-papers-heading';
        heading.textContent = papers.length === 1 ? 'Paper' : 'Papers';
        list.appendChild(heading);
        papers.forEach((paper) => list.appendChild(buildPaperCard(paper)));
      }
    }
  }

  function renderNotFound(list) {
    const back = document.createElement('a');
    back.className = 'news-back-link';
    back.href = 'news.html';
    back.innerHTML = '<i class="fa-solid fa-arrow-left" aria-hidden="true"></i> All News';
    list.appendChild(back);

    const empty = document.createElement('p');
    empty.className = 'news-empty';
    empty.textContent = 'News item not found.';
    list.appendChild(empty);
  }

  // --- Entry point ---

  async function render() {
    const list = document.getElementById('news-list');
    if (!list || !window.PLANContent) return;

    let items = [];
    try {
      items = await window.PLANContent.getNews();
    } catch (e) {
      console.error(e);
    }

    list.innerHTML = '';

    const params = new URLSearchParams(window.location.search);
    const requestedId = String(params.get('id') || '').trim();

    if (requestedId) {
      const item = items.find((n) => String(n.id || '') === requestedId);
      if (item) {
        await renderDetail(list, item);
      } else {
        renderNotFound(list);
      }
      return;
    }

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'news-empty';
      empty.textContent = 'No news yet. Check back soon.';
      list.appendChild(empty);
      return;
    }

    await renderArchive(list, items);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
