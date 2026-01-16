(function () {
  const cache = new Map();

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
    getTeam,
    getPublications,
  };
})();
