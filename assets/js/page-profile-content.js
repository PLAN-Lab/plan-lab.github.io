(function () {
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toParagraphs(text) {
    const trimmed = String(text || '').trim();
    if (!trimmed) return '';
    const paras = trimmed.split(/\n\s*\n/g).map((p) => p.replace(/\s+/g, ' ').trim());
    return paras.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
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

  function setLink(el, href) {
    const clean = String(href || '').trim();
    if (!clean) {
      el.style.display = 'none';
      el.removeAttribute('href');
      return;
    }
    el.style.display = '';
    el.href = href;
  }

  function normalizeSearchText(text) {
    let s = String(text || '').toLowerCase();
    if (typeof s.normalize === 'function') {
      s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    }
    s = s.replace(/[^a-z0-9]+/g, ' ');
    return s.trim().replace(/\s+/g, ' ');
  }

  function nameTokens(text) {
    const normalized = normalizeSearchText(text);
    return normalized ? normalized.split(' ') : [];
  }

  function authorMatchesMember(author, memberName) {
    const a = nameTokens(author);
    const m = nameTokens(memberName);
    if (!a.length || !m.length) return false;

    return a.join(' ') === m.join(' ');
  }

  function memberSearchSeeds(member) {
    const seeds = new Set();
    const name = String(member && member.name ? member.name : '').trim();
    if (name) seeds.add(name);

    const aliases = Array.isArray(member && member.aliases) ? member.aliases : [];
    aliases
      .map((a) => String(a || '').trim())
      .filter(Boolean)
      .forEach((alias) => {
        seeds.add(alias);
        const tokens = nameTokens(name);
        const last = tokens[tokens.length - 1] || '';
        if (last && !alias.toLowerCase().includes(last.toLowerCase())) {
          seeds.add(`${alias} ${last}`.trim());
        }
      });

    const id = String(member && member.id ? member.id : '').trim();
    if (id) {
      const parts = id.split('-').filter(Boolean);
      if (parts.length > 1) {
        seeds.add(parts.slice(1).join(' '));
      }
    }

    return Array.from(seeds);
  }

  function formatDisplayName(member) {
    const name = String(member && member.name ? member.name : '').trim();
    const aliases = Array.isArray(member && member.aliases) ? member.aliases.filter(Boolean) : [];
    if (!name) return 'Team Member';
    if (member && member.id === 'phd-tianjiao(joey)-yu' && aliases.length) {
      const alias = String(aliases[0] || '').trim();
      if (!alias) return name;
      const tokens = name.split(/\s+/);
      if (tokens.length >= 2) {
        const first = tokens[0];
        const last = tokens[tokens.length - 1];
        return `${first} (${alias}) ${last}`;
      }
    }
    const aliasLabel = aliases.length ? ` (${aliases.join(', ')})` : '';
    return name + aliasLabel;
  }

  function memberPublications(publications, member) {
    const seeds = memberSearchSeeds(member);
    if (!seeds.length) return [];
    return publications.filter((p) => {
      const authors = Array.isArray(p.authors) ? p.authors : [];
      return authors.some((a) => seeds.some((seed) => authorMatchesMember(a, seed)));
    });
  }

  async function init() {
    if (!window.PLANContent) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const members = await window.PLANContent.getTeam();
    const member = members.find((m) => m.id === id) || members[0];
    if (!member) return;

    const papersSection = document.getElementById('papers');
    const showPapersBtn =
      document.getElementById('profile-show-papers') || document.querySelector('.btn-papers');

    const nameEl = document.getElementById('profile-name');
    const roleEl = document.getElementById('profile-role');
    const avatarEl = document.getElementById('profile-avatar');
    const bioEl = document.getElementById('profile-bio');
    const aliases = Array.isArray(member.aliases) ? member.aliases.filter(Boolean) : [];

    if (nameEl) {
      nameEl.textContent = formatDisplayName(member);
    }
    if (roleEl) roleEl.textContent = (member.title && member.title[0]) || member.role || '';
    if (avatarEl && member.avatar) {
      avatarEl.src = member.avatar;
      avatarEl.alt = member.name || 'Profile photo';
    }
    if (bioEl) {
      bioEl.innerHTML = toParagraphs(member.bio);
    }

    document.title = (member.name ? `${member.name} | ` : '') + 'PLAN Lab';

    const emailLink = document.getElementById('profile-email');
    const websiteLink = document.getElementById('profile-website');
    const githubLink = document.getElementById('profile-github');
    const scholarLink = document.getElementById('profile-scholar');

    if (emailLink) setLink(emailLink, member.email ? `mailto:${member.email}` : '');
    if (websiteLink) setLink(websiteLink, member.website);
    if (githubLink) setLink(githubLink, member.github);
    if (scholarLink) setLink(scholarLink, member.googleScholar);

    const publications = (await window.PLANContent.getPublications()).slice().sort(byDateDesc);
    const mine = memberPublications(publications, member);

    const author = String(member.name || '').trim();
    const memberId = String(member.id || '').trim();
    let alias = '';
    if (memberId) {
      const parts = memberId.split('-').filter(Boolean);
      if (parts.length > 1) alias = parts.slice(1).join(' ');
    }

    const publicationsParams = new URLSearchParams();
    if (author) publicationsParams.set('author', author);
    if (alias) publicationsParams.set('alias', alias);
    const publicationsSearchUrl = publicationsParams.toString()
      ? `publications.html?${publicationsParams.toString()}`
      : 'publications.html';

    if (showPapersBtn) {
      showPapersBtn.href = publicationsSearchUrl;
      showPapersBtn.style.display = '';
    }

    const papersTitle = document.getElementById('papers-title');
    if (papersTitle) {
      papersTitle.textContent = 'Recent Publications';
    }

    const list = document.getElementById('papers-list');
    if (!list) return;
    list.innerHTML = '';

    if (!mine.length) {
      if (papersSection) papersSection.style.display = 'none';
      return;
    }

    if (papersSection) papersSection.style.display = '';
    mine.slice(0, 2).forEach((pub) => {
      const item = document.createElement('div');
      item.className = 'paper-item';

      const a = document.createElement('a');
      a.className = 'paper-title';
      a.textContent = pub.title || pub.projectName || 'Untitled';
      const paperUrl = window.PLANContent.doiToUrl(pub.doi);
      if (paperUrl) {
        a.href = paperUrl;
        a.target = '_blank';
        a.rel = 'noreferrer';
      } else {
        a.href = `publications.html#pub-${pub.id}`;
      }

      const meta = document.createElement('p');
      meta.className = 'paper-meta';
      meta.textContent = window.PLANContent.formatVenue(pub.venue, pub.year, pub.venueAbbr);

      item.appendChild(a);
      item.appendChild(meta);
      list.appendChild(item);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init().catch((e) => console.error(e));
    });
  } else {
    init().catch((e) => console.error(e));
  }
})();
