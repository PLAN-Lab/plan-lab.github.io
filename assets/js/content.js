(function () {
  const cache = new Map();
  const LEGACY_MEMBER_STATUS_PREFIX = /^(?:alumn(?:i|us|a)|phd(?:-student)?|masters?(?:-student)?|undergrads?(?:-student)?|undergraduate(?:-student)?|postdocs?|pi)-/i;

  function formatVenue(venue, year, venueAbbr) {
    const rawAbbr = String(venueAbbr || '').trim();
    const rawYear = year === undefined || year === null || year === '' ? '' : String(year);
    if (rawAbbr) {
      if (!rawYear) return rawAbbr;
      if (rawAbbr.includes(rawYear)) return rawAbbr;
      return `${rawAbbr} ${rawYear}`;
    }

    const rawVenue = String(venue || '').trim();
    if (!rawVenue) return rawYear;

    const v = rawVenue.toLowerCase();
    const rules = [
      { includes: 'computer vision and pattern recognition', abbr: 'CVPR' },
      { includes: 'international conference on computer vision', abbr: 'ICCV' },
      { includes: 'european conference on computer vision', abbr: 'ECCV' },
      { includes: 'winter conference on applications of computer vision', abbr: 'WACV' },
      { includes: 'neural information processing systems', abbr: 'NeurIPS' },
      { includes: 'neurips', abbr: 'NeurIPS' },
      { includes: 'international conference on learning representations', abbr: 'ICLR' },
      { includes: 'international conference on machine learning', abbr: 'ICML' },
      { includes: 'transactions on machine learning research', abbr: 'TMLR' },
      { includes: 'transactions on pattern analysis and machine intelligence', abbr: 'TPAMI' },
      { includes: 'empirical methods in natural language processing', abbr: 'EMNLP' },
      { includes: 'miccai', abbr: 'MICCAI' },
      { includes: 'arxiv', abbr: 'arXiv' },
    ];

    for (const rule of rules) {
      if (v.includes(rule.includes)) {
        return rawYear ? `${rule.abbr} ${rawYear}` : rule.abbr;
      }
    }

    const paren = rawVenue.match(/\(([^)]+)\)/);
    if (paren && paren[1]) {
      const token = paren[1].trim();
      if (token && token.length <= 12) {
        return rawYear ? `${token} ${rawYear}` : token;
      }
    }

    const tokens = (rawVenue.match(/\b[A-Z]{2,10}\b/g) || []).filter(
      (t) => !['IEEE', 'CVF'].includes(t)
    );
    if (tokens.length) {
      const token = tokens[tokens.length - 1];
      return rawYear ? `${token} ${rawYear}` : token;
    }

    return rawYear ? `${rawVenue} ${rawYear}` : rawVenue;
  }

  function resolveUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return trimmed.slice(1);
    return trimmed;
  }

  function doiToUrl(doi) {
    if (!doi) return '';
    const trimmed = String(doi).trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return 'https://doi.org/' + trimmed;
  }

  function stripLegacyMemberStatusPrefix(id) {
    return String(id || '')
      .trim()
      .replace(LEGACY_MEMBER_STATUS_PREFIX, '');
  }

  function memberProfileUrl(memberOrId) {
    const id = typeof memberOrId === 'object' && memberOrId
      ? memberOrId.id
      : memberOrId;
    const memberId = String(id || '').trim();
    return memberId ? `member.html?id=${encodeURIComponent(memberId)}` : 'member.html';
  }

  function findMember(members, id) {
    const list = Array.isArray(members) ? members : [];
    const requestedId = String(id || '').trim();
    if (!requestedId) return null;

    const exact = list.find((member) => String(member.id || '').trim() === requestedId);
    if (exact) return exact;

    const normalizedId = stripLegacyMemberStatusPrefix(requestedId);
    return list.find((member) => {
      const memberId = String(member.id || '').trim();
      const legacyIds = Array.isArray(member.legacyIds) ? member.legacyIds : [];
      return memberId === normalizedId || legacyIds.includes(requestedId);
    }) || null;
  }

  function formatMemberName(member, fallback) {
    const name = String(member && member.name ? member.name : '').trim();
    if (!name) return fallback || 'Team Member';

    const displayName = String(member && member.displayName ? member.displayName : '').trim();
    if (displayName) return displayName;

    const aliases = Array.isArray(member && member.aliases)
      ? member.aliases.map((alias) => String(alias || '').trim()).filter(Boolean)
      : [];
    return aliases.length ? `${name} (${aliases.join(', ')})` : name;
  }

  async function loadJson(path) {
    if (cache.has(path)) return cache.get(path);

    const promise = fetch(path, { cache: 'no-store' }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`Failed to load ${path}: ${res.status}`);
      }
      return res.json();
    });

    cache.set(path, promise);
    return promise;
  }

  async function getTeam() {
    const data = await loadJson('assets/data/team.json');
    return data.members || [];
  }

  async function getPublications() {
    const data = await loadJson('assets/data/publications.json');
    return data.publications || [];
  }

  window.PLANContent = {
    resolveUrl,
    doiToUrl,
    formatVenue,
    memberProfileUrl,
    findMember,
    formatMemberName,
    getTeam,
    getPublications,
  };
})();
