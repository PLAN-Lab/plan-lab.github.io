/* Shared section structure for the reviewed project pages. */
(() => {
 'use strict';
 const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
 };
 const key = text => text.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
 const heading = section => section.querySelector('h2');
 const container = section => section.querySelector(':scope > .container');
 function createSection(label, paragraphs = [], bullets = []) {
  const section = el('section', 'section');
  const box = el('div', 'container is-max-desktop');
  box.append(el('h2', 'title is-3', label));
  const copy = el('div', 'content');
  paragraphs.forEach(text => copy.append(el('p', '', text)));
  if (bullets.length) {
   const list = el('ul'); bullets.forEach(text => list.append(el('li', '', text))); copy.append(list);
  }
  if (copy.childNodes.length) box.append(copy);
  section.append(box); return section;
 }
 function labelSection(section, label, role) {
  let title = heading(section);
  if (!title) { title = el('h2', 'title is-3'); container(section).prepend(title); }
  title.textContent = label; title.classList.add('title', 'is-3');
  section.dataset.studioSection = role;
  if (!section.id) section.id = `studio-${role}`;
  if (!title.id) title.id = `${section.id}-title`;
  section.setAttribute('aria-labelledby', title.id);
  return section;
 }
 function splitTail(section, start, label) {
  const root = container(section);
  const range = document.createRange(); range.setStartBefore(start); range.setEnd(root, root.childNodes.length);
  const tail = createSection(label); const content = container(tail);
  content.replaceChildren(range.extractContents());
  const first = content.querySelector('h2,h3');
  if (first === start) {
   const title = el('h2', 'title is-3', label); title.id = first.id; first.replaceWith(title);
  } else content.prepend(el('h2', 'title is-3', label));
  section.after(tail); return tail;
 }
 async function normalize(main, spec) {
  if (!spec) return;
  const slug=location.pathname.split("/").filter(Boolean).at(-1);
  const hero = main.querySelector(':scope > .hero');
  // Some source pages accidentally nest complete sections. Promote the same nodes
  // in document order, preserving media, result controls, IDs and event listeners.
  const sourceSections = [...main.querySelectorAll('section')];
  sourceSections.forEach(section => main.append(section));
  const find = label => [...main.querySelectorAll(':scope > section')].find(section => key(heading(section)?.textContent || '') === key(label));
  const teaser = main.querySelector(':scope > .hero.teaser');
  // Dedicated summaries replace the inline teaser summaries, not figure captions.
  if (teaser) {
   const inline = teaser.querySelector('.tldr');
   if (inline) inline.remove();
   else {
    const first = teaser.querySelector('.content');
    if (first && (/(TL;DR)/i.test(first.textContent) || spec.teaserSummary)) {
     // DreamPartGen places its video grid inside the summary text wrapper.
     // Preserve complete media blocks when removing that inline summary.
     const media = [...first.children].filter(node => node.matches('img,video,iframe,model-viewer') || node.querySelector('img,video,iframe,model-viewer'));
     if (media.length) first.replaceChildren(...media); else first.remove();
    }
   }
  }
  (spec.splits || []).forEach(split => {
   const start = [...main.querySelectorAll('h2,h3,img,[data-result-source]')].find(node => split.image ? (node.getAttribute('src') || node.dataset.resultSource)?.endsWith(split.image) : key(node.textContent) === key(split.heading));
   if (!start) throw new Error(`Missing split source in ${slug}: ${split.heading || split.image}`);
   const section = start.closest('section');
   splitTail(section, start, split.label);
  });
  const summary = find('TL;DR') || createSection('TL;DR', [], spec.tldr);
  labelSection(summary, 'TL;DR', 'tldr');
  const summaryCopy = summary.querySelector('.content'); summaryCopy.classList.add('studio-tldr-box');
  if (spec.tldr) summaryCopy.replaceChildren(...spec.tldr.map(text => el('p', '', text)));
  if (!summary.isConnected) main.append(summary);
  function role(label, roleName, options = {}) {
   let section = options.source ? find(options.source) : find(label);
   if (options.teaser) section = teaser;
   if (options.source && !section) throw new Error(`Missing ${roleName} source in ${slug}: ${options.source}`);
   if (!section) { section = createSection(label, options.paragraphs, options.bullets); main.append(section); }
   if (options.teaser) {
    section.classList.remove('hero', 'teaser'); section.classList.add('section');
    const wrapper = section.querySelector('.hero-body');
    if (wrapper) wrapper.replaceWith(...wrapper.childNodes);
   }
   labelSection(section, label, roleName);
   if (options.image) {
    const imageSpec = typeof options.image === 'string' ? {source: options.image} : options.image;
    const image = main.querySelector(`img[src$="${imageSpec.source}"]`);
    if (!image) throw new Error(`Missing ${roleName} figure in ${slug}: ${imageSpec.source}`);
    const frame = image.closest('.media-wrap, .media-wrap-teaser, figure, .media-card') || image;
    if (imageSpec.src) image.src = imageSpec.src;
    if (imageSpec.alt) image.alt = imageSpec.alt;
    if (imageSpec.width) image.width = imageSpec.width;
    if (imageSpec.height) image.height = imageSpec.height;
    if (imageSpec.caption) {
     const previousParent = frame.parentElement;
     const figure = el('figure', 'studio-method-figure');
     figure.append(frame, el('figcaption', '', imageSpec.caption));
     container(section).append(figure);
     if (previousParent.matches('div') && !previousParent.children.length && !previousParent.textContent.trim()) previousParent.remove();
    } else container(section).append(frame);
   }
   (options.additionalSources || []).forEach(source => {
    const item = typeof source === 'string' ? {source} : source;
    const extra = item.source === '@teaser' ? teaser : find(item.source);
    if (!extra || extra === section) throw new Error(`Missing extra ${roleName} source in ${slug}: ${item.source}`);
    const extraHeading = heading(extra);
    const sub = el('h3', 'title is-4', item.label || extraHeading?.textContent.replace(/^[^\p{L}\p{N}]+/u, '') || 'Generation Samples');
    if (extraHeading) { sub.id = extraHeading.id; extraHeading.replaceWith(sub); }
    else container(extra).prepend(sub);
    const body = el('div', 'studio-subsection'); body.append(...container(extra).childNodes);
    container(section).append(body); extra.remove();
   });
   return section;
  }
  role('Abstract', 'abstract', {paragraphs: spec.abstract});
  const contributions = role('Contributions', 'contributions', {source: spec.contributionsSource, bullets: spec.contributions});
  if(spec.contributions) {
   let list=contributions.querySelector('ul');
   if(!list) {list=el('ul');(contributions.querySelector('.content') || container(contributions)).append(list);}
   list.replaceChildren(...spec.contributions.map((text,index)=>{
    const item=el('li');const lead=spec.contributionLeads?.[index];
    if(lead && text.startsWith(lead))item.append(el('strong','studio-contribution-lead',lead),document.createTextNode(text.slice(lead.length)));
    else item.textContent=text;
    // Keep the formal backbone name together at a line break.
    [...item.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE && node.textContent.includes('LTX-Video 2B')).forEach(node=>{
     const parts=node.textContent.split('LTX-Video 2B'),fragment=document.createDocumentFragment();
     parts.forEach((part,i)=>{if(i)fragment.append(el('span','studio-inline-name','LTX-Video 2B'));fragment.append(document.createTextNode(part));});
     node.replaceWith(fragment);
    });
    return item;
   }));
  }
  contributions.querySelectorAll('.fa-li,i.fa-star,svg[data-icon="star"]').forEach(node => node.remove());
  contributions.querySelectorAll('ul').forEach(list => {
   list.classList.remove('fa-ul'); list.classList.add('studio-contribution-list'); list.setAttribute('role', 'list');
  });
  const method = role(`${spec.name} Method`, 'method', spec.method);
  const methodTitle = heading(method);
  const nameParts = (spec.headingName || [{text: spec.name, color: '#ff915b'}]).map(part => {
   const span = el('span', 'studio-method-name', part.text);
   if (part.gradient) {
    span.classList.add('studio-method-gradient'); span.style.backgroundImage = part.gradient;
   } else span.style.color = part.color;
   return span;
  });
  methodTitle.replaceChildren(...nameParts, document.createTextNode(' Method'));
  if (spec.dataset) role(`${spec.dataset.name} Dataset`, 'dataset', spec.dataset);
  if (spec.quantitative) role('Quantitative Results', 'quantitative', spec.quantitative);
  if (spec.qualitative) role('Qualitative Results', 'qualitative', spec.qualitative);
  const order = {tldr: 10, abstract: 20, contributions: 30, method: 40, dataset: 50, quantitative: 60, ablations: 65, qualitative: 70, bibtex: 90};
  const sections = [...main.querySelectorAll(':scope > section')].filter(section => section !== hero);
  sections.forEach(section => {
   if (section.dataset.studioSection) return;
   const title = heading(section); if (!title) return;
   const text = title.textContent.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').trim();
   if (/^(BibTeX|Citation)$/i.test(text)) labelSection(section, 'BibTeX', 'bibtex');
   else if (/^Quantitative Results$/i.test(text)) labelSection(section, 'Quantitative Results', 'quantitative');
   else if (/^Qualitative Results$/i.test(text)) labelSection(section, 'Qualitative Results', 'qualitative');
   else if (/^Ablation/i.test(text)) labelSection(section, 'Ablation Studies', 'ablations');
   else { title.textContent = text; section.dataset.studioSection = 'supplement'; }
  });
  sections.sort((a,b) => (order[a.dataset.studioSection] || 15) - (order[b.dataset.studioSection] || 15));
  sections.forEach(section => main.append(section));
  main.dataset.studioSectionsReady = 'true';
  return spec;
 }
 window.PLANSections = {normalize};
})();
