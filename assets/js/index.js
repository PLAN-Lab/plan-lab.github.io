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
    const img = document.createElement('div');
    img.className = 'vid-card-img';
    const cardCover = pub.cardCover || pub.cover;
    if (cardCover) {
      img.style.backgroundImage = `url(${cardCover})`;
      const probe = new Image();
      probe.decoding = 'async';
      probe.onload = () => {
        const isPortrait = probe.naturalHeight > probe.naturalWidth;
        img.classList.add(isPortrait ? 'is-portrait' : 'is-landscape');
      };
      probe.src = cardCover;
    }
    inner.appendChild(img);
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

  function formatDisplayName(member) {
    const name = String(member && member.name ? member.name : '').trim();
    const aliases = Array.isArray(member && member.aliases) ? member.aliases.filter(Boolean) : [];
    if (!name) return 'Unnamed';
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

  function buildTeamCard(member) {
    const a = document.createElement('a');
    a.className = 'team-card' + (member.group === 'alumni' ? ' is-alumni' : '');
    a.href = member.profileUrl || 'member.html';

    const img = document.createElement('img');
    img.className = 'avatar-img';
    img.alt = member.name || 'Team member';
    if (member.avatar) img.src = member.avatar;
    img.loading = 'lazy';
    img.decoding = 'async';

    const h3 = document.createElement('h3');
    h3.textContent = formatDisplayName(member);

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
	      '2025-Shen-fine-grained-preference-optimi', // SpatialReasoner
	      '2025-Nguyen-calico-part-focused-semantic-c', // CALICO
		  '2025-Liu-palm-progress-aware', //PALM
          '2025-Li-hallusegbench-counterfactual-v', // HalluSeg
	      '2025-Yu-core3d-collaborative-reasoning-as', // CoRe3D
	      //'2025-Wahed-mocha-are-code-language-models', // MOCHA
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
    team: false,
  };

  const sectionLoaders = {
    publications: renderRecentWork,
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

  function hashToSectionId(hash) {
    const raw = String(hash || '').replace(/^#/, '').trim();
    if (!raw) return '';
    if (raw === 'team' || raw.startsWith('team-')) return 'team';
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
      const prioritized = hashToSectionId(window.location.hash);
      if (prioritized) {
        await loadSection(prioritized);
      }

      setupSectionObserver();

      window.addEventListener('hashchange', () => {
        const next = hashToSectionId(window.location.hash);
        if (next) loadSection(next);
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
