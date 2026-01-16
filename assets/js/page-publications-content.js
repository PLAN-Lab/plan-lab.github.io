(function () {
  const BATCH_SIZE = 5;

  function normalizeSearchText(text) {
    let s = String(text || '').toLowerCase();
    if (typeof s.normalize === 'function') {
      s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    }
    s = s.replace(/[^a-z0-9]+/g, ' ');
    return s.trim().replace(/\s+/g, ' ');
  }

  function parseSearchGroups(term) {
    const raw = String(term || '')
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    const groups = raw
      .map((p) => normalizeSearchText(p))
      .map((p) => p.split(' ').filter(Boolean))
      .filter((tokens) => tokens.length);
    return groups;
  }

  function groupsMatch(haystack, groups) {
    if (!groups.length) return true;
    return groups.some((tokens) => tokens.every((t) => haystack.includes(t)));
  }

  function buildAuthorGroups(author, alias) {
    const groups = [];

    const authorNorm = normalizeSearchText(author);
    const authorTokens = authorNorm ? authorNorm.split(' ').filter(Boolean) : [];
    if (authorTokens.length) {
      groups.push(authorTokens);
      if (authorTokens.length >= 2) {
        groups.push([authorTokens[0], authorTokens[authorTokens.length - 1]]);
      }
    }

    const aliasNorm = normalizeSearchText(alias);
    const aliasTokens = aliasNorm ? aliasNorm.split(' ').filter(Boolean) : [];
    if (aliasTokens.length) {
      groups.push(aliasTokens);
      if (aliasTokens.length >= 2) {
        groups.push([aliasTokens[0], aliasTokens[aliasTokens.length - 1]]);
      }
    }

    const seen = new Set();
    return groups.filter((g) => {
      const key = g.join(' ');
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function buildSearchIndex(pub) {
    const parts = [
      pub.title,
      pub.projectName,
      (pub.authors || []).join(' '),
      pub.venue,
      pub.venueAbbr,
      pub.year,
      pub.doi,
    ];
    return normalizeSearchText(parts.filter(Boolean).join(' '));
  }

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

  let labMemberByName = new Map();

  function normalizeName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function buildAuthors(pub) {
    const authors = Array.isArray(pub.authors) ? pub.authors : [];
    const highlightedAuthors = new Set(['yuanzhe liu', 'xingyou liu']);
    const parts = authors.map((a) => {
      const name = String(a || '').trim();
      if (!name) return '';
      const key = normalizeName(name);
      const member = labMemberByName.get(key);
      if (member && member.profileUrl) {
        return `<a class="pub-author-lab" href="${escapeHtml(member.profileUrl)}">${escapeHtml(name)}</a>`;
      }
      if (highlightedAuthors.has(key)) {
        return `<span class="pub-author-lab">${escapeHtml(name)}</span>`;
      }
      return escapeHtml(name);
    });
    return parts.filter(Boolean).join(', ');
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function makeLinkButton(href, label, className, iconClass) {
    const a = document.createElement('a');
    a.className = className;
    a.href = href;
    if (/^https?:\/\//i.test(href)) {
      a.target = '_blank';
      a.rel = 'noreferrer';
    }
    if (iconClass) {
      const iconWrap = document.createElement('span');
      iconWrap.className = 'icon';
      const icon = document.createElement('i');
      icon.className = iconClass;
      iconWrap.appendChild(icon);
      const labelSpan = document.createElement('span');
      labelSpan.textContent = label;
      a.appendChild(iconWrap);
      a.appendChild(labelSpan);
    } else {
      a.textContent = label;
    }
    return a;
  }

  function renderPublicationCard(pub) {
    const card = document.createElement('article');
    card.className = 'pub-card';
    card.id = `pub-${pub.id}`;
    card.dataset.search = [
      pub.title,
      pub.projectName,
      (pub.authors || []).join(' '),
      pub.venue,
      pub.venueAbbr,
      pub.year,
      pub.doi,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (pub.searchIndex) {
      card.dataset.search = pub.searchIndex;
    }

    const imgWrap = document.createElement('div');
    imgWrap.className = 'pub-img-container';

    if (pub.cover) {
      const img = document.createElement('img');
      img.className = 'pub-img';
      img.src = pub.cover;
      img.alt = pub.projectName ? `${pub.projectName} cover` : 'Publication cover';
      img.loading = 'lazy';
      img.decoding = 'async';
      const applyImageFit = () => {
        const w = img.naturalWidth || 0;
        const h = img.naturalHeight || 0;
        if (!w || !h) return;
        const ratio = w / h;
        const target = 4 / 3;
        const diff = Math.abs(ratio - target) / target;
        img.style.objectFit = diff <= 0.12 ? 'fill' : 'contain';
      };
      img.addEventListener('load', applyImageFit);
      if (img.complete) applyImageFit();
      imgWrap.appendChild(img);
    }

    const content = document.createElement('div');
    content.className = 'pub-content';

    const venue = document.createElement('div');
    venue.className = 'pub-venue';
    venue.textContent = window.PLANContent.formatVenue(pub.venue, pub.year, pub.venueAbbr);

    const title = document.createElement('h2');
    title.className = 'pub-title';
    title.textContent = pub.title || pub.projectName || 'Untitled';

    const authors = document.createElement('p');
    authors.className = 'pub-authors';
    authors.innerHTML = buildAuthors(pub);

    const links = document.createElement('div');
    links.className = 'pub-links';

    const paperUrlRaw = pub.links && pub.links.paper ? pub.links.paper : '';
    const paperUrlFromDoi = window.PLANContent ? window.PLANContent.doiToUrl(pub.doi) : '';
    const paperUrlResolved = window.PLANContent ? window.PLANContent.resolveUrl(paperUrlRaw) : paperUrlRaw;
    const paperUrl = paperUrlResolved || paperUrlFromDoi;
    const projectUrlRaw = pub.links && pub.links.website ? pub.links.website : '';
    const projectUrl = window.PLANContent ? window.PLANContent.resolveUrl(projectUrlRaw) : projectUrlRaw;
    const codeUrlRaw = pub.links && pub.links.code ? pub.links.code : '';
    const codeUrl = window.PLANContent ? window.PLANContent.resolveUrl(codeUrlRaw) : codeUrlRaw;
    const videoUrlRaw = pub.links && pub.links.video ? pub.links.video : '';
    const videoUrl = window.PLANContent ? window.PLANContent.resolveUrl(videoUrlRaw) : videoUrlRaw;
    const dataUrlRaw = pub.links && pub.links.data ? pub.links.data : '';
    const dataUrl = window.PLANContent ? window.PLANContent.resolveUrl(dataUrlRaw) : dataUrlRaw;
    const primaryUrl = projectUrl || paperUrl || paperUrlFromDoi;

    if (primaryUrl) {
      const imgLink = document.createElement('a');
      imgLink.href = primaryUrl;
      imgLink.setAttribute('aria-label', `Open ${pub.projectName || pub.title || 'publication'}`);
      imgLink.style.display = 'block';
      imgLink.style.width = '100%';
      imgLink.style.height = '100%';
      imgLink.style.color = 'inherit';
      imgLink.style.textDecoration = 'none';
      while (imgWrap.firstChild) {
        imgLink.appendChild(imgWrap.firstChild);
      }
      imgWrap.appendChild(imgLink);

      const titleLink = document.createElement('a');
      titleLink.href = primaryUrl;
      titleLink.setAttribute('aria-label', `Open ${pub.projectName || pub.title || 'publication'}`);
      titleLink.style.color = 'inherit';
      titleLink.style.textDecoration = 'none';
      titleLink.textContent = title.textContent;
      title.textContent = '';
      title.appendChild(titleLink);
    }

    if (paperUrl) {
      links.appendChild(makeLinkButton(paperUrl, 'Paper', 'btn btn-outline', 'fa-solid fa-file-pdf'));
    }
    if (projectUrl) {
      links.appendChild(makeLinkButton(projectUrl, 'Project', 'btn btn-primary', 'fa-solid fa-link'));
    } else {
      if (codeUrl) {
        links.appendChild(makeLinkButton(codeUrl, 'Code', 'btn btn-outline', 'fab fa-github'));
      }
      if (videoUrl) {
        links.appendChild(makeLinkButton(videoUrl, 'Video', 'btn btn-outline', 'fa-solid fa-video'));
      }
      if (dataUrl) {
        links.appendChild(makeLinkButton(dataUrl, 'Data', 'btn btn-outline', 'fa-solid fa-database'));
      }
    }

    content.appendChild(venue);
    content.appendChild(title);
    content.appendChild(authors);
    if (links.childNodes.length) content.appendChild(links);

    card.appendChild(imgWrap);
    card.appendChild(content);
    return card;
  }

  function getTargetPubIdFromHash() {
    const raw = String(window.location.hash || '').replace(/^#/, '').trim();
    if (!raw) return '';
    if (raw.startsWith('pub-')) return raw.slice(4);
    return '';
  }

  function scrollToHashTarget() {
    const raw = String(window.location.hash || '').replace(/^#/, '').trim();
    if (!raw) return;
    const el = document.getElementById(raw);
    if (!el) return;
    requestAnimationFrame(() => {
      try {
        el.scrollIntoView({ block: 'start' });
      } catch {
        el.scrollIntoView();
      }
    });
  }

  async function init() {
    if (!window.PLANContent) return;

    const pubList = document.getElementById('pubList');
    if (!pubList) return;
    const searchInput = document.getElementById('searchInput');
    const noResultsMsg = document.getElementById('noResults');

    pubList.innerHTML = '<div style="padding:10px; color:rgba(255,255,255,0.7)">Loading publications…</div>';

    try {
      const [pubsRaw, teamRaw] = await Promise.all([
        window.PLANContent.getPublications(),
        window.PLANContent.getTeam(),
      ]);
      const pubs = pubsRaw.slice().sort(byDateDesc);

      const members = Array.isArray(teamRaw) ? teamRaw : [];
      labMemberByName = new Map();
      members.forEach((m) => {
        const name = String(m.name || '').trim();
        if (!name) return;
        const profileUrl = m.profileUrl || '';
        labMemberByName.set(normalizeName(name), { name, profileUrl, aliases: m.aliases || [] });

        const aliases = Array.isArray(m.aliases) ? m.aliases : [];
        aliases
          .map((a) => String(a || '').trim())
          .filter(Boolean)
          .forEach((alias) => {
            labMemberByName.set(normalizeName(alias), { name, profileUrl, aliases: m.aliases || [] });
            const tokens = normalizeName(name).split(' ');
            const last = tokens[tokens.length - 1] || '';
            if (last && !normalizeName(alias).includes(last)) {
              labMemberByName.set(
                normalizeName(`${alias} ${last}`),
                { name, profileUrl, aliases: m.aliases || [] }
              );
            }
          });
      });

      const allPubs = pubs.map((p) => {
        const searchIndex = buildSearchIndex(p);
        return Object.assign({}, p, { searchIndex });
      });

      const sentinel = document.createElement('div');
      sentinel.className = 'pub-sentinel';
      sentinel.style.height = '1px';
      sentinel.style.width = '100%';

      const insertCards = (items) => {
        if (!items.length) return;
        const frag = document.createDocumentFragment();
        items.forEach((p) => frag.appendChild(renderPublicationCard(p)));
        pubList.insertBefore(frag, sentinel);
      };

      let filteredPubs = allPubs.slice();
      let renderedCount = 0;
      let isLoading = false;
      let observer = null;
      let deepLinkGroups = null;

      const renderNextBatch = () => {
        if (isLoading) return;
        if (renderedCount >= filteredPubs.length) return;
        isLoading = true;
        const next = filteredPubs.slice(renderedCount, renderedCount + BATCH_SIZE);
        renderedCount += next.length;
        insertCards(next);
        isLoading = false;
      };

      const resetList = () => {
        pubList.innerHTML = '';
        pubList.appendChild(sentinel);
        renderedCount = 0;
      };

      const updateNoResults = () => {
        if (!noResultsMsg) return;
        noResultsMsg.style.display = filteredPubs.length ? 'none' : 'block';
      };

      const ensureHashTargetVisible = () => {
        const targetPubId = getTargetPubIdFromHash();
        if (!targetPubId) return 0;
        const idx = filteredPubs.findIndex((p) => p && p.id === targetPubId);
        if (idx >= 0) return idx + 1;
        return 0;
      };

      const runSearch = (term) => {
        const groups = deepLinkGroups || parseSearchGroups(term);
        if (!groups.length) {
          filteredPubs = allPubs.slice();
        } else {
          filteredPubs = allPubs.filter((p) => groupsMatch(p.searchIndex, groups));
        }
      };

      const applySearch = (term) => {
        runSearch(term);
        resetList();
        updateNoResults();
        const requiredCount = ensureHashTargetVisible();
        const initialCount = Math.max(BATCH_SIZE, requiredCount);
        if (filteredPubs.length) {
          const seed = filteredPubs.slice(0, initialCount);
          renderedCount = seed.length;
          insertCards(seed);
        }
        if (requiredCount) scrollToHashTarget();
      };

      pubList.innerHTML = '';
      pubList.appendChild(sentinel);

      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) renderNextBatch();
          });
        });
        observer.observe(sentinel);
      }

      if (searchInput) {
        const params = new URLSearchParams(window.location.search);
        const author = params.get('author');
        const alias = params.get('alias');
        const q = params.get('q');
        if (author) {
          searchInput.value = author;
          deepLinkGroups = buildAuthorGroups(author, alias);
        } else if (q && !searchInput.value) {
          searchInput.value = q;
        }

        searchInput.addEventListener('input', () => {
          deepLinkGroups = null;
          applySearch(searchInput.value);
        });
      }

      applySearch(searchInput ? searchInput.value : '');

      if (!observer) {
        while (renderedCount < filteredPubs.length) {
          renderNextBatch();
        }
      }
    } catch (e) {
      console.error(e);
      pubList.innerHTML = '<div style="padding:10px; color:#FF5F05">Could not load publications.</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
