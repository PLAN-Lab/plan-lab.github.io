(function () {
  const ROOT_PREFIX = '../../';
  const THREE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const pdfObjectUrlCache = new Map();
  let threeLoadPromise = null;

  function ensureLayer(id) {
    const existing = document.getElementById(id);
    if (existing) return existing;
    const el = document.createElement('div');
    el.id = id;
    document.body.insertAdjacentElement('afterbegin', el);
    return el;
  }

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    if (threeLoadPromise) return threeLoadPromise;

    threeLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = THREE_CDN;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load THREE.js'));
      document.head.appendChild(script);
    });

    return threeLoadPromise;
  }

  function initRibbonBackground() {
    if (!window.THREE) return;
    const container = document.getElementById('canvas-container');
    if (!container) return;
    if (container.querySelector('canvas')) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.PlaneGeometry(35, 12, 200, 64);
    const uniforms = {
      uTime: { value: 0 },
      uScrollOffset: { value: 0 },
      uColorBlue: { value: new THREE.Color('#2d7dd2') },
      uColorOrange: { value: new THREE.Color('#FF5F05') },
      uColorDark: { value: new THREE.Color('#13294B') },
    };

    const vertexShader = `
      uniform float uTime; uniform float uScrollOffset;
      varying vec2 vUv; varying float vElevation; varying float vFlow;
      void main() {
        vUv = uv; vec3 pos = position;
        float t = uTime * 0.3 + uScrollOffset * 0.0005;
        float mainWave = sin(pos.x * 0.3 + t) * 2.0;
        float ripple = cos(pos.x * 1.5 + t * 1.5) * 0.2;
        float twist = sin(pos.x * 0.5 + t) * pos.y * 0.5;
        pos.z = mainWave + ripple + twist;
        vElevation = pos.z; vFlow = sin(pos.x * 0.3 + t);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 uColorBlue; uniform vec3 uColorOrange; uniform vec3 uColorDark;
      varying float vElevation; varying float vFlow;
      void main() {
        float colorMix = vFlow * 0.5 + 0.5;
        vec3 color = mix(uColorBlue, uColorOrange, colorMix);
        float depth = smoothstep(-2.0, 3.0, vElevation);
        color = mix(uColorDark, color, depth);
        color += (colorMix * 0.15);
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const materialMain = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
    });
    const meshMain = new THREE.Mesh(geometry, materialMain);
    meshMain.rotation.x = -0.3;
    scene.add(meshMain);

    const materialWire = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const meshWire = new THREE.Mesh(geometry, materialWire);
    meshWire.position.z = -1.0;
    meshWire.scale.set(1.1, 1.1, 1);
    scene.add(meshWire);

    const clock = new THREE.Clock();
    const animate = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      uniforms.uScrollOffset.value = window.scrollY || 0;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener(
      'resize',
      () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      { passive: true }
    );
  }

  async function setupProjectBackground() {
    if (!document.body.classList.contains('page-project')) return;
    ensureLayer('canvas-container');
    await loadThree();
    try {
      initRibbonBackground();
    } catch (e) {
      console.warn('[PLAN] Failed to init project background', e);
    }
  }

  function normalizeTeamId(raw) {
    return String(raw || '')
      .replace(/^\/team\//, '')
      .replace(/^team\//, '')
      .replace(/\/$/, '')
      .trim();
  }

  function rewriteTeamLinks() {
    document.querySelectorAll('a[href^="/team/"], a[href^="team/"]').forEach((a) => {
      const id = normalizeTeamId(a.getAttribute('href'));
      if (!id) return;

      a.setAttribute('href', `${ROOT_PREFIX}member.html?id=${encodeURIComponent(id)}`);
      a.removeAttribute('target');
    });
  }

  function rewriteLabHomeLinks() {
    document.querySelectorAll('a[href="https://plan-lab.github.io/"], a[href="https://plan-lab.github.io"]').forEach((a) => {
      a.setAttribute('href', `${ROOT_PREFIX}index.html#hero`);
      a.removeAttribute('target');
    });
  }

  function isPdfUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) return false;
    const withoutHash = raw.split('#')[0];
    return /\.pdf(\?|$)/i.test(withoutHash);
  }

  function isSameOriginUrl(url) {
    try {
      const resolved = new URL(String(url || ''), window.location.href);
      return resolved.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  async function getPdfObjectUrl(url) {
    const resolved = new URL(String(url || ''), window.location.href).toString();
    if (pdfObjectUrlCache.has(resolved)) return pdfObjectUrlCache.get(resolved);

    const res = await fetch(resolved, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Failed to fetch PDF: ${res.status}`);
    }

    const blob = await res.blob();
    const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(pdfBlob);
    pdfObjectUrlCache.set(resolved, objectUrl);
    return objectUrl;
  }

  function createPdfModal() {
    const modal = document.createElement('div');
    modal.className = 'pdf-modal';
    modal.hidden = true;

    modal.innerHTML = `
      <div class="pdf-modal-panel" role="dialog" aria-modal="true" aria-label="PDF Preview">
        <div class="pdf-modal-bar">
          <div class="pdf-modal-title">PDF Preview</div>
          <div class="pdf-modal-actions">
            <a class="pdf-modal-open" href="#" target="_blank" rel="noreferrer">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
              <span>Open</span>
            </a>
            <button type="button" class="pdf-modal-close">
              <i class="fa-solid fa-xmark"></i>
              <span>Close</span>
            </button>
          </div>
        </div>
        <iframe class="pdf-modal-iframe" title="PDF Preview" src="about:blank" loading="lazy"></iframe>
      </div>
    `;

    const panel = modal.querySelector('.pdf-modal-panel');
    const titleEl = modal.querySelector('.pdf-modal-title');
    const iframe = modal.querySelector('.pdf-modal-iframe');
    const openLink = modal.querySelector('.pdf-modal-open');
    const closeBtn = modal.querySelector('.pdf-modal-close');

    let previousBodyOverflow = '';

    const close = () => {
      modal.hidden = true;
      iframe.src = 'about:blank';
      document.body.style.overflow = previousBodyOverflow;
    };

    const open = async (url, title) => {
      titleEl.textContent = title || 'PDF Preview';
      openLink.href = url;
      iframe.src = 'about:blank';
      previousBodyOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      modal.hidden = false;
      closeBtn.focus();

      if (isSameOriginUrl(url)) {
        try {
          iframe.src = await getPdfObjectUrl(url);
          return;
        } catch {
          // Fallback to direct URL below.
        }
      }

      iframe.src = url;
    };

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
    panel.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) {
        e.preventDefault();
        close();
      }
    });

    document.body.appendChild(modal);
    return { open, close };
  }

  function setupPdfEmbeds() {
    const pdfFrames = Array.from(document.querySelectorAll('iframe[data-pdf-src]'));
    if (!pdfFrames.length) return;

    const loadFrame = async (iframe) => {
      if (!iframe || iframe.dataset.pdfLoaded === '1') return;
      iframe.dataset.pdfLoaded = '1';

      const src = iframe.getAttribute('data-pdf-src');
      if (!src) return;

      const absolute = new URL(src, window.location.href).toString();
      if (!isSameOriginUrl(absolute)) {
        iframe.src = absolute;
        return;
      }

      try {
        iframe.src = await getPdfObjectUrl(absolute);
      } catch {
        iframe.src = absolute;
      }
    };

    if (!('IntersectionObserver' in window)) {
      pdfFrames.forEach((iframe) => {
        loadFrame(iframe).catch((e) => console.warn('[PLAN] Failed to load PDF embed', e));
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const iframe = entry.target;
          observer.unobserve(iframe);
          loadFrame(iframe).catch((e) => console.warn('[PLAN] Failed to load PDF embed', e));
        });
      },
      { rootMargin: '600px 0px', threshold: 0.01 }
    );

    pdfFrames.forEach((iframe) => {
      try {
        if (!iframe.loading) iframe.loading = 'lazy';
      } catch {
        // ignore
      }
      observer.observe(iframe);
    });
  }

  function setupPdfPreview() {
    const pdfLinks = Array.from(document.querySelectorAll('a[href]')).filter((a) =>
      isPdfUrl(a.getAttribute('href'))
    );
    if (!pdfLinks.length) return;

    const modal = createPdfModal();

    pdfLinks.forEach((a) => {
      a.removeAttribute('download');
      a.addEventListener('click', (e) => {
        if (!isSameOriginUrl(a.getAttribute('href'))) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const url = a.href;
        const label = String(a.textContent || '').replace(/\s+/g, ' ').trim();
        modal.open(url, label || 'PDF Preview');
      });
    });
  }

  function collapseConsecutiveBr() {
    document.querySelectorAll('br').forEach((br) => {
      const prevEl = br.previousElementSibling;
      if (prevEl && prevEl.tagName === 'BR') br.remove();
    });
  }

  function removeEmptyTextBlocks() {
    document.querySelectorAll('p, figcaption').forEach((el) => {
      if (el.children && el.children.length) return;
      if (String(el.textContent || '').trim()) return;
      el.remove();
    });
  }

  function setupScrolledNav() {
    const nav = document.querySelector('.glass-nav');
    if (!nav) return;

    const threshold = 100;
    const onScroll = () => {
      if (window.scrollY > threshold) {
        nav.classList.add('scrolled-nav');
      } else {
        nav.classList.remove('scrolled-nav');
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function setupLazyMediaHints() {
    document.querySelectorAll('img').forEach((img) => {
      try {
        if (!img.loading) img.loading = 'lazy';
        if (!img.decoding) img.decoding = 'async';
      } catch {
        // ignore
      }
    });

    document.querySelectorAll('iframe').forEach((iframe) => {
      try {
        if (!iframe.loading) iframe.loading = 'lazy';
      } catch {
        // ignore
      }
    });
  }

  function init() {
    setupLazyMediaHints();
    setupProjectBackground().catch((e) => console.warn('[PLAN] Project background unavailable', e));
    rewriteTeamLinks();
    rewriteLabHomeLinks();
    collapseConsecutiveBr();
    removeEmptyTextBlocks();
    setupPdfEmbeds();
    setupPdfPreview();
    setupScrolledNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', () => {
    for (const objectUrl of pdfObjectUrlCache.values()) {
      URL.revokeObjectURL(objectUrl);
    }
    pdfObjectUrlCache.clear();
  });
})();
