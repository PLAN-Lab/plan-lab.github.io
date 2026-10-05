/* Shared presentation for the reviewed PLAN Lab project pages. */
(async () => {
 'use strict';
 const assetVersion = window.PLAN_PROJECT_ASSET_VERSION || 'reviewed-project-pages-e418f00-v1';
 if (document.body.classList.contains('project-studio')) return;
 const main = document.querySelector('main');
 const hero = main?.querySelector('.hero');
 const title = hero?.querySelector('.publication-title');
 if (!title) return;
 document.body.classList.add('project-studio');
 hero.classList.add('studio-header');
 const pathParts = location.pathname.split('/').filter(Boolean);
 const slug = pathParts[pathParts.indexOf('projects') + 1];
 if (slug === 'graphvid') document.body.classList.add('studio-graphvid');
 if (slug === 'rewardflow') document.body.classList.add('studio-rewardflow');
 if (slug === '3d-vcd') document.body.classList.add('studio-3d-vcd');
 if (slug === 'VisAnom') document.body.classList.add('studio-visanom');
 if (slug === 'calico') document.body.classList.add('studio-calico');
 if (slug === 'cogniroute') document.body.classList.add('studio-cogniroute');
 if (slug === 'dreampartgen') document.body.classList.add('studio-dreampartgen');
 if (slug === 'core3d') document.body.classList.add('studio-core3d');
 if (slug === 'dash') document.body.classList.add('studio-dash');
 if (slug === 'ec-vlm') document.body.classList.add('studio-ec-vlm');
 if (slug === 'ece') document.body.classList.add('studio-ece');
 if (slug === 'egoforge') document.body.classList.add('studio-egoforge');
 if (slug === 'hallusegbench') document.body.classList.add('studio-hallusegbench');
 if (slug === 'latte-flow') document.body.classList.add('studio-latte-flow');
 if (slug === 'mmplanner') document.body.classList.add('studio-mmplanner');
 if (slug === 'mtsbench') document.body.classList.add('studio-mtsbench');
 if (slug === 'prima') document.body.classList.add('studio-prima');
 if (slug === 'pyratok') document.body.classList.add('studio-pyratok');
 if (slug === 'part2gs') document.body.classList.add('studio-part2gs');
 if (slug === 'silsa') document.body.classList.add('studio-silsa');
 if (slug === 'spatialreasoner') document.body.classList.add('studio-spatialreasoner');
 if (slug === 'unidflow') document.body.classList.add('studio-unidflow');
 if (slug === 'vtam') document.body.classList.add('studio-vtam');
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
 };
 const makeButton = (label, fn, cls='studio-control') => {
  const button = el('button', cls, label); button.type='button'; button.addEventListener('click', fn); return button;
 };
 const rawTitle = title.textContent.replace(/\s+/g,' ').trim();
 const colon = rawTitle.indexOf(':');
 if (colon > 0 && colon < 40) {
  title.replaceChildren(el('span','studio-name',rawTitle.slice(0,colon)),el('span','studio-subtitle',rawTitle.slice(colon+1).trim()));
 }
 // Read affiliation mappings separately from the original names and author links.
 // The source byline remains authoritative, including contribution annotations.
 const authorResponse = await fetch('../../assets/data/project-authors.json?v='+assetVersion);
 if (!authorResponse.ok) throw new Error(`Author metadata HTTP ${authorResponse.status}`);
 const authorData = await authorResponse.json();
 const authorSpec = authorData.projects[slug];
 if (authorSpec?.authorGroups.length) {
  const groups = [...hero.querySelectorAll('.publication-authors')];
  const institutionIds = [...new Set(Object.values(authorSpec.markers))];
  const multipleInstitutions = institutionIds.length > 1;
  const marker = id => {
   const institution = authorData.institutions[id];
   const sup = el('sup',`studio-affiliation-marker${id==='uiuc'?' studio-plan-marker':''}`,institution.symbol);
   sup.title = institution.name; sup.setAttribute('aria-label',institution.name); return sup;
  };
  const authors = authorSpec.authorGroups.flatMap(i=>[...groups[i].querySelectorAll('.author-block')].map(source=>{
   const copy = source.cloneNode(true);
   // A few legacy author spans contain other authors; handle each exactly once.
   copy.querySelectorAll('.author-block').forEach(n=>n.remove());
   const ids = [], notes = [];
   copy.querySelectorAll('sup').forEach(sup=>{
    const tokens = sup.textContent.match(/\d+|[♦♣♠♥★*†‡]/g) || [];
    tokens.forEach(token=>{
     if(authorSpec.markers[token]) ids.push(authorSpec.markers[token]);
     else if(/^[*†‡]$/.test(token)) notes.push(token);
     else throw new Error(`Unknown affiliation ${slug}: ${token}`);
    }); sup.remove();
   });
   if(!ids.length && institutionIds.length===1) ids.push(institutionIds[0]);
   if(!ids.length) throw new Error(`Missing affiliation in ${slug}: ${copy.textContent.trim()}`);
   const name = copy.textContent.replace(/\s+/g,' ').replace(/[,;\s]+$/,'').trim();
   const node = el('span','author-block studio-author');
   node.dataset.affiliations = [...new Set(ids)].join(',');
   const originalLink = copy.querySelector('a');
   if(originalLink) {
    const link = originalLink.cloneNode(false); link.removeAttribute('class'); link.removeAttribute('style');
    link.textContent = name; node.append(link);
   } else node.append(document.createTextNode(name));
   if(multipleInstitutions) [...new Set(ids)].forEach((id,i)=>{
    if(i) node.append(el('sup','studio-marker-separator',',')); node.append(marker(id));
   });
   if(notes.length) node.append(el('sup','studio-contribution-marker',notes.join('')));
   return node;
  }));
  authors.forEach((node,i)=>{if(i<authors.length-1)node.append(document.createTextNode(', '));});
  const byline = groups[authorSpec.authorGroups[0]];
  byline.classList.add('studio-author-list');
  const rowSizes = authorSpec.rows || (authors.length>8?[Math.ceil(authors.length/2),Math.floor(authors.length/2)]:[authors.length]);
  let offset = 0;
  byline.replaceChildren(...rowSizes.map(size=>{
   const row = el('div','studio-author-row'); row.append(...authors.slice(offset,offset+size)); offset+=size; return row;
  }));
  authorSpec.authorGroups.slice(1).forEach(i=>groups[i].remove());
  const affiliations = groups[authorSpec.affiliationGroups[0]];
  affiliations.classList.add('studio-affiliations');
  affiliations.removeAttribute('style');
  affiliations.replaceChildren(...institutionIds.map(id=>{
   const item = el('span','studio-affiliation');
   item.dataset.institution = id;
   if(multipleInstitutions) item.append(marker(id));
   if(id==='uiuc' && authorSpec.planLab) {
    const lab = el('a','studio-lab-name','PLAN Lab'); lab.href='../../index.html';
    item.append(lab,document.createTextNode(' · '));
   }
   item.append(el('span','studio-affiliation-name',authorData.institutions[id].name)); return item;
  }));
  authorSpec.affiliationGroups.slice(1).forEach(i=>groups[i].remove());
  (authorSpec.contributionGroups || []).forEach(i=>groups[i].classList.add('studio-contribution-note'));
  hero.querySelectorAll('.equal-note, .author-notes, .equal-contribution').forEach(n=>n.classList.add('studio-contribution-note'));
 }
 // Use the same resource labels, icons and order, with recorded project URLs.
 const resourceVersion = assetVersion;
 const resourceResponse = await fetch('../../assets/data/project-resources.json?v='+resourceVersion);
 if (!resourceResponse.ok) throw new Error(`Resource metadata HTTP ${resourceResponse.status}`);
 const resources = (await resourceResponse.json()).projects[slug];
 const icons = {Paper:'fa-solid fa-file-pdf', arXiv:'fa-solid fa-file-lines', Code:'fa-brands fa-github', Dataset:'fa-solid fa-database', 'Interactive 3D Models':'fa-solid fa-cube'};
 const linkGroups = [...hero.querySelectorAll('.publication-links')];
 const links = linkGroups[0];
 if (links && resources) {
  const original = [...hero.querySelectorAll('.publication-links a.button')];
  const buttons = resources.map((resource,index)=>{
   const button = original[index] || el('a','button is-rounded');
   button.classList.toggle('studio-primary',resource.label==='Paper');
   button.dataset.resource = resource.label;
   button.removeAttribute('aria-disabled');button.removeAttribute('title');
   if(resource.href) button.setAttribute('href',resource.href);
   else {
    button.removeAttribute('href');button.setAttribute('aria-disabled','true');
    button.title = resource.label==='arXiv'?'No arXiv version is recorded for this project.':`${resource.label} is not available yet.`;
   }
   const icon=el('span','icon');icon.setAttribute('aria-hidden','true');
   if(resource.label==='Checkpoint') {icon.classList.add('studio-hf-icon');icon.textContent='🤗';}
   else icon.append(el('i',icons[resource.label] || 'fa-solid fa-arrow-up-right-from-square'));
   const suffix=resource.href?'':resource.label==='arXiv'?' (unavailable)':' (coming soon)';
   button.replaceChildren(icon,el('span','',resource.label+suffix));
   return button;
  });
  links.replaceChildren(...buttons);linkGroups.slice(1).forEach(group=>group.remove());
 }
 // Remove legacy inline paint; the shared palette controls text, tables and charts.
 main.querySelectorAll('[style]').forEach(node=>{
  if(node.style.color) node.style.removeProperty('color');
  if(node.matches('td,th,tr,table') && node.style.backgroundColor)node.style.removeProperty('background-color');
 });
 // Result figures are replaced before any hero figure is selected or cloned.
 const originalTeaser = main.querySelector('.hero.teaser img, .section img')?.cloneNode(true);
 await new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='../../assets/js/project-results.js?v='+assetVersion;
  script.onload=resolve;script.onerror=()=>reject(new Error('Native result renderer unavailable'));
  document.head.append(script);
 });
 await window.PLANResults.render(main,slug);
 if (slug === 'graphvid') {
  main.querySelectorAll('.model-spec-grid').forEach(grid=>grid.remove());
  const heatmap = main.querySelector('[data-result-source="static/images/gvc_corr.png"]');
  heatmap?.parentElement.classList.add('studio-graphvid-statistics');
  main.querySelectorAll('table.metric-table tr.sota-row').forEach(row=>row.classList.add('studio-context-baseline'));
 }
 // Normalize section labels and order after replacing result figures, while
 // retaining the original media nodes and their interactive controls.
 await new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='../../assets/js/project-sections.js?v='+assetVersion;
  script.onload=resolve;script.onerror=()=>reject(new Error('Project section renderer unavailable'));
  document.head.append(script);
 });
 const sectionSpec = await window.PLANSections.normalize(main,slug);
 if(sectionSpec?.heroTitle) {
  title.replaceChildren(el('span','studio-name',sectionSpec.heroTitle.name),el('span','studio-subtitle',sectionSpec.heroTitle.subtitle));
  hero.querySelectorAll('img[src*="logo"]').forEach(image=>image.remove());
 }
 const wordmark=title.querySelector('.studio-name');
 if(wordmark && wordmark.textContent.length>11 && !/\s/.test(wordmark.textContent))wordmark.classList.add('studio-long-name');
 // Read the current citation independently of cached page HTML.
 const citationCode=main.querySelector('[data-studio-section="bibtex"] pre code');
 if(citationCode && slug!=='template') {
  const citationVersion=assetVersion;
  const response=await fetch('../../assets/data/project-citations.json?v='+citationVersion,{cache:'no-store'});
  if(!response.ok)throw new Error(`Citation metadata HTTP ${response.status}`);
  const citation=(await response.json()).projects[slug];
  if(!citation)throw new Error(`Missing citation metadata for ${slug}`);
  const fields=Object.entries(citation.fields).map(([key,value])=>`  ${key}={${value}}`);
  citationCode.textContent=`@${citation.entryType}{${citation.key},\n${fields.join(',\n')}\n}`;
 }
 const presentationModules={egoforge:'PLANEgoForge',hallusegbench:'PLANHalluSeg', 'latte-flow':'PLANLatteFlow',mmplanner:'PLANMMPlanner',mtsbench:'PLANmTSBench',prima:'PLANPRIMA',pyratok:'PLANPyraTok',silsa:'PLANSILSA',spatialreasoner:'PLANSpatialReasoner',unidflow:'PLANUniDFlow',vtam:'PLANVTAM'};
 if(presentationModules[slug]) {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error(`${slug} presentation unavailable`));document.head.append(script);
  });
  await window[presentationModules[slug]].prepare(main);
 }
 if (slug === 'VisAnom') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('VisAnom presentation unavailable'));document.head.append(script);
  });
  await window.PLANVisAnom.prepare(main);
 }
 if (slug === 'calico') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('CALICO presentation unavailable'));document.head.append(script);
  });
  await window.PLANCalico.prepare(main);
 }
 if (slug === 'cogniroute') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('CogniRoute presentation unavailable'));document.head.append(script);
  });
  await window.PLANCogniRoute.prepare(main);
 }
 if (slug === 'core3d') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('CoRe3D presentation unavailable'));document.head.append(script);
  });
  await window.PLANCore3D.prepare(main);
 }
 if (slug === 'dreampartgen') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('DreamPartGen presentation unavailable'));document.head.append(script);
  });
  await window.PLANDreamPartGen.prepare(main);
 }
 if (slug==='core3d' || slug==='dreampartgen') {
  const modelLink=hero.querySelector('[data-resource="Interactive 3D Models"]');
  modelLink.addEventListener('click',event=>{
   if(event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
   const target=main.querySelector(modelLink.getAttribute('href'));
   if(!target)return;
   event.preventDefault();
   if(location.hash!==modelLink.getAttribute('href'))history.pushState(null,'',modelLink.getAttribute('href'));
   target.scrollIntoView({behavior:'instant',block:'start'});
   const heading=target.querySelector('h2');heading.tabIndex=-1;heading.focus({preventScroll:true});
  });
 }
 if (slug === 'dash') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('DaSH presentation unavailable'));document.head.append(script);
  });
  await window.PLANDaSH.prepare(main);
 }
 if (slug === 'ece') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('Uncertainty in Action presentation unavailable'));document.head.append(script);
  });
  await window.PLANECE.prepare(main);
 }
 if (slug === 'ec-vlm') {
  await new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='static/js/studio.js?v='+assetVersion;
   script.onload=resolve;script.onerror=()=>reject(new Error('EC-VLM presentation unavailable'));document.head.append(script);
  });
  await window.PLANECVLM.prepare(main);
 }
 if (slug === '3d-vcd') {
  const heal=main.querySelector('[data-result-source="static/images/heal-result1.png"]');
  heal.closest('.studio-subsection').querySelectorAll('p').forEach(p=>{if(!p.closest('.studio-native-result'))p.remove();});
  // Legacy pastel backgrounds hid the light text in callouts and example cards.
  const ablations = main.querySelector('[data-studio-section="ablations"]');
  [...ablations.querySelectorAll('.content > div')].find(node=>node.querySelector('b')?.textContent.trim()==='Key Insight:')?.classList.add('studio-vcd-insight');
  ablations.querySelectorAll('span[style]').forEach(node=>{
   if(node.style.backgroundColor)node.classList.add('studio-vcd-variant');
  });
  main.querySelectorAll('[data-studio-section="qualitative"] img').forEach(image=>{
   image.parentElement.classList.add('studio-vcd-example');
   image.nextElementSibling?.classList.add('studio-vcd-example-caption');
  });
 }
 window.PLANResults.append(main);
 // Keep scores centered, with equal space reserved for gains beside each score.
 main.querySelectorAll('table td').forEach(cell=>{
  const gains=[...cell.querySelectorAll('span')].filter(span=>/^[↑↓]\s*[\d.]+%$/.test(span.textContent.trim()) || ((slug==='VisAnom' || slug==='dash') && span.classList.contains('studio-metric-gain')));
  if(!gains.length)return;
  gains.forEach(gain=>{gain.classList.add('studio-metric-gain');gain.remove();});
  const value=el('span','studio-metric-value');value.append(...cell.childNodes);
  const pair=el('span','studio-metric-pair');pair.append(value,...gains);cell.replaceChildren(pair);
 });
 main.querySelectorAll('table').forEach(table=>{
  const nameKey=text=>text.replace(/[^\p{L}\p{N}]/gu,'').toLowerCase();
  const methodName=nameKey(sectionSpec?.name || slug);
  table.querySelectorAll('tbody tr').forEach(row=>{
   const label=row.cells[0];if(!label || row.classList.contains('studio-group'))return;
   const name=label.textContent.trim();
   if(!row.classList.contains('studio-context-baseline') && (/\b(?:ours|our method)\b/i.test(name) || nameKey(name).startsWith(methodName)))row.classList.add('studio-ours');
   // Reference indices in method names add clutter without helping comparison.
   if(!/^\d/.test(name)) {
    const walker=document.createTreeWalker(label,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))node.textContent=node.textContent.replace(/\s*\[\d+(?:\s*[,–-]\s*\d+)*\]/g,'');
   }
  });
  const gainColumns=[...new Set([...table.querySelectorAll('.studio-metric-gain')].map(gain=>gain.closest('td').cellIndex))];
  gainColumns.forEach(index=>{
   const cells=[...table.querySelectorAll('tbody tr')].map(row=>row.cells[index]).filter(cell=>cell && cell.colSpan===1);
   const scoreWidth=Math.max(...cells.map(cell=>(cell.querySelector('.studio-metric-value')?.textContent || cell.textContent).trim().length));
   const gainWidth=(Math.max(...cells.flatMap(cell=>[...cell.querySelectorAll('.studio-metric-gain')].map(gain=>gain.textContent.trim().length)))+1)*.8;
   cells.forEach(cell=>{
    if(!cell.querySelector('.studio-metric-pair')) {
     const value=el('span','studio-metric-value');value.append(...cell.childNodes);
     const slot=el('span','studio-gain-slot');slot.setAttribute('aria-hidden','true');
     const pair=el('span','studio-metric-pair');pair.append(value,slot);cell.replaceChildren(pair);
    }
    cell.style.setProperty('--studio-score-width',`${scoreWidth}ch`);
    cell.style.setProperty('--studio-gain-width',`${gainWidth}ch`);
   });
  });
  table.querySelectorAll('tbody tr').forEach(row=>{
   const cells=[...row.cells],text=row.textContent.trim();
   if(row.classList.contains('studio-group') || (cells.length===1 && cells[0].colSpan>1 && text.length<100 && !/[.!?]$/.test(text)))row.classList.add('studio-group');
  });
 });
 main.querySelectorAll('table tbody td,table tbody th').forEach(cell=>{
  if(/^[+−–\-]?\d[\d.,]*(?:\s|$|%|±|[↑↓])/.test(cell.textContent.trim()) && !cell.hasAttribute('colspan'))cell.classList.add('studio-numeric-cell');
 });
 if(slug==='phantom')main.querySelectorAll('p').forEach(p=>{
  p.childNodes.forEach(node=>{
   if(node.nodeType===Node.TEXT_NODE)node.textContent=node.textContent.replace('Green percentages show improvement','Orange percentages beside scores show improvement');
  });
 });
 // Keep a short closing phrase together, without changing the scientific text.
 // On narrow screens, let a phrase wrap when its full width would overflow.
 const measure=document.createElement('canvas').getContext('2d');
 const endings=new ResizeObserver(entries=>entries.forEach(({target:p})=>{
  const ending=p.querySelector('.studio-ending');if(!ending)return;
  const style=getComputedStyle(p);measure.font=style.font;
  const available=p.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-12;
  ending.style.whiteSpace=measure.measureText(ending.textContent.replace(/\s+/g,' ')).width<available?'nowrap':'normal';
 }));
 main.querySelectorAll('.section p').forEach(p=>{
  // Justified summaries and abstracts need naturally wrapping final lines.
  if(p.closest('[data-studio-section="abstract"], [data-studio-section="tldr"], [data-studio-section="method"]'))return;
  // These result captions need naturally wrapping final lines.
  if((slug==='core3d' || slug==='dash' || slug==='dreampartgen' || slug==='ec-vlm' || slug==='ece') && p.closest('[data-studio-section="quantitative"]'))return;
  const text=p.textContent;const words=[...text.matchAll(/\S+/g)];if(words.length<30)return;
  const start=words.at(-3).index,end=words.at(-1).index+words.at(-1)[0].length;
  const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node,offset=0,startNode,endNode,startOffset,endOffset;
  while((node=walker.nextNode())) {
   const next=offset+node.textContent.length;
   if(!startNode && start>=offset && start<next){startNode=node;startOffset=start-offset;}
   if(end>offset && end<=next){endNode=node;endOffset=end-offset;}
   offset=next;
  }
  if(!startNode || !endNode)return;
  const range=document.createRange();range.setStart(startNode,startOffset);range.setEnd(endNode,endOffset);
  const ending=el('span','studio-ending');ending.append(range.extractContents());range.insertNode(ending);endings.observe(p);
 });

 const originalSections = [...main.querySelectorAll(':scope > section')];
 const nav = el('nav','studio-section-nav'); nav.setAttribute('aria-label','On this project page');
 originalSections.forEach((section,index) => {
  if (section === hero) return;
  const heading = section.querySelector('h2');
  if (!heading) return;
  if (!section.id) section.id = `studio-section-${index}`;
  const link=el('a','',heading.textContent.replace('✅','').trim()); link.href=`#${section.id}`;
  if(section.dataset.studioSection)link.dataset.section=section.dataset.studioSection;
  nav.append(link);
 });
 hero.after(nav);
 const lightbox=el('dialog','studio-lightbox'); lightbox.setAttribute('aria-label','Expanded project figure');
 const lightboxHead=el('div','studio-lightbox-header'); const caption=el('span');
 const close=makeButton('Close ×',()=>lightbox.close()); lightboxHead.append(caption,close);
 const fullImage=el('img'); lightbox.append(lightboxHead,fullImage); document.body.append(lightbox);
 lightbox.addEventListener('click',event=>{if(event.target===lightbox) lightbox.close();});
 function zoomable(image,container) {
  const button=makeButton('Expand ↗',()=>{fullImage.src=image.src; fullImage.alt=image.alt; caption.textContent=image.alt || 'Project figure'; lightbox.showModal();},'studio-zoom');
  button.setAttribute('aria-label',`Expand ${image.alt || 'project figure'}`); container.append(button);
 }
 function featureBase(label, note) {
  const section=el('section','studio-feature'); section.setAttribute('aria-label',label);
  const head=el('div','studio-feature-head'); head.append(el('h2','studio-feature-title',label));
  const foot=el('div','studio-feature-foot'); foot.append(el('p','',note));
  section.append(head); nav.after(section);
  return {section,head,foot};
 }
 function imageCard(label,src,alt,index,graph=false) {
  const card=el('div','studio-media-card'); const labelNode=el('div','studio-media-label'); labelNode.append(el('b','',index),document.createTextNode(label));
  const frame=el('div',`studio-media-frame${graph?' graph':''}`); const image=el('img'); image.src=src; image.alt=alt; image.decoding='async'; frame.append(image); zoomable(image,frame); card.append(labelNode,frame); return {card,image};
 }
 function videoCard(label,src,index) {
  const card=el('div','studio-media-card'); const labelNode=el('div','studio-media-label'); labelNode.append(el('b','',index),document.createTextNode(label));
  const frame=el('div','studio-media-frame'); const video=el('video'); video.src=src; video.muted=true; video.loop=true; video.playsInline=true; video.controls=true; video.preload='metadata'; video.dataset.studioAutoplay='true';
  video.setAttribute('aria-label',label); frame.append(video); card.append(labelNode,frame); return {card,video};
 }
 const initForcePreviews=[];
 function projectExamples(spec) {
  const section=el('section','section studio-opening-examples');
  section.dataset.studioSection='examples';
  const box=el('div','container');section.append(box);
  section.setAttribute('aria-label',`${sectionSpec.name} examples`);
  const grid=el('div','studio-example-grid');box.append(grid);
  const items=spec.media || [{source:spec.source,label:spec.label,alt:spec.alt,caption:spec.caption}];
  if(items.length===1)grid.classList.add('studio-example-single');
  items.forEach(item=>{
   const card=el('figure','studio-example-card');
   const mediaType=item.type || 'img';
   const source=[...main.querySelectorAll(mediaType)].find(node=>{
    const path=node.getAttribute('src') || node.querySelector('source')?.getAttribute('src') || '';
    return mediaType==='iframe'?path.includes(item.source):path.endsWith(item.source.replace(/^\.\//,''));
   });
   if(mediaType==='iframe' && !source)throw new Error(`Missing hosted example in ${slug}: ${item.source}`);
   const media=source?.cloneNode(true) || el(mediaType);
   if(!source)media.src=`./static/images/${item.source}`;
   media.removeAttribute('style');media.removeAttribute('class');
   media.removeAttribute('id');
   if(mediaType==='iframe') {
    const url=new URL(media.src);url.searchParams.set('muted','true');url.searchParams.set('loop','true');
    if(!reducedMotion)url.searchParams.set('autoplay','true');
    media.src=url.href;media.loading='eager';media.title=`${sectionSpec.name}: ${item.label}`;
   } else if(mediaType==='video') {
    media.muted=true;media.loop=true;media.autoplay=true;media.playsInline=true;media.controls=true;
    if(item.poster)media.poster=item.poster;
    media.setAttribute('aria-label',item.label);
   } else {
    media.alt=item.alt || item.label || `${sectionSpec.name} example`;media.loading='eager';media.decoding='async';
   }
   const frame=el('div','studio-example-media');frame.append(media);card.append(frame);
   if(mediaType==='img')zoomable(media,frame);
   if(item.label || item.caption || (items.length===1 && spec.caption)) {
    const caption=el('figcaption','studio-example-caption');
    if(item.label)caption.append(el('strong','studio-example-label',item.label));
    if(item.caption || (items.length===1 && spec.caption))caption.append(el('p','',item.caption || spec.caption));
    card.append(caption);
   }
   grid.append(card);
  });
  if(items.length>1 && spec.caption)box.append(el('p','studio-examples-note',spec.caption));
  // The original teaser supplies method or evaluation context, rather than an
  // extra unnamed panel repeating the opening figure and summary.
  const teaser=main.querySelector(':scope > .hero.teaser');
  if(teaser) {
   const target=main.querySelector(`[data-studio-section="${spec.context || 'method'}"] > .container`);
   const body=teaser.querySelector('.hero-body') || teaser.querySelector(':scope > .container');
   if(target && body) {
    const context=el('div','studio-subsection studio-teaser-context');context.append(...body.childNodes);
    context.querySelectorAll('.content:empty,p:empty').forEach(node=>node.remove());
    if(context.textContent.trim() || context.querySelector('img,video,iframe,model-viewer'))target.append(context);
   }
   teaser.remove();
  }
  main.querySelectorAll('.studio-overview').forEach(overview=>{
   const method=main.querySelector('[data-studio-section="method"] > .container');
   if(!method)return;
   const label=overview.querySelector(':scope > h3');if(label)label.textContent=spec.processTitle || 'How the framework works';
   overview.classList.remove('studio-next-result');method.append(overview);
  });
  if(originalTeaser && !['unidflow','vtam'].includes(slug) && ![...main.querySelectorAll('img'),...section.querySelectorAll('img')].some(image=>image.src===originalTeaser.src)) {
   const method=main.querySelector('[data-studio-section="method"] > .container');
   const frame=el('figure','studio-method-figure studio-overview-figure');
   originalTeaser.loading='lazy';frame.append(originalTeaser);zoomable(originalTeaser,frame);method.append(frame);
  }
  nav.after(section);
 }
 const custom={
  VisAnom:()=>window.PLANVisAnom.feature({main,nav,zoomable}),
  calico:()=>window.PLANCalico.feature({main,nav,zoomable}),
  cogniroute:()=>window.PLANCogniRoute.feature({main,nav,zoomable}),
  core3d:()=>window.PLANCore3D.feature({main,nav,zoomable}),
  dash:()=>window.PLANDaSH.feature({nav,zoomable}),
  dreampartgen:()=>window.PLANDreamPartGen.feature({main,nav,zoomable}),
  'ec-vlm':()=>window.PLANECVLM.feature({main,nav,zoomable}),
  ece:()=>window.PLANECE.feature({main,nav,zoomable}),
  egoforge:()=>window.PLANEgoForge.feature({main,nav,zoomable}),
  hallusegbench:()=>window.PLANHalluSeg.feature({main,nav,zoomable}),
  mmplanner:()=>window.PLANMMPlanner.feature({main,nav}),
  mtsbench:()=>window.PLANmTSBench.feature({main,nav}),
  prima:()=>window.PLANPRIMA.feature({main,nav}),
  pyratok:()=>window.PLANPyraTok.feature({main,nav}),
  silsa:()=>window.PLANSILSA.feature({main,nav}),
  spatialreasoner:()=>window.PLANSpatialReasoner.feature({main,nav}),
  graphvid:()=>{
   const section=el('section','studio-feature');section.setAttribute('aria-label','Graph-guided motion control');nav.after(section);
   const grid=el('div','studio-trio');
   const a=imageCard('Intended motion','static/videos/intent_gif/12.gif','Intended motion for GraphVid example 1','01');
   const b=imageCard('Interaction graph','static/videos/gen_graph/12.svg','Edited interaction graph for GraphVid example 1','02',true);
   const c=videoCard('GraphVid output','static/videos/gen_video/12.mp4','03');grid.append(a.card,b.card,c.card);section.append(grid);
  },
  phantom:()=>{
   const {section,head,foot}=featureBase('See the physics in motion','Force direction appears on the first frame, then disappears as the generated motion begins.');
   const grid=el('div','studio-trio');
   const samples=[
    {label:'Car · left',file:'car_left.mp4',poster:'car-left.jpg',from:[128,130],to:[45,130]},
    {label:'Car · along the road',file:'car_up.mp4',poster:'car-up.jpg',from:[195,105],to:[115,86]},
    {label:'Sunflower · right',file:'flower_right.mp4',poster:'sunflower-right.jpg',from:[105,145],to:[185,145]}
   ];
   const previews=samples.map((sample,i)=>{
    const {card,video}=videoCard(sample.label,`static/images/supplementary/Force-prompting%20Results/${sample.file}`,`0${i+1}`);
    video.loop=false;video.poster=`static/images/force-previews/${sample.poster}`;
    video.dataset.studioAutoplay='false';video.dataset.forcePreview='true';
    video.dataset.studioPaused=String(reducedMotion);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.classList.add('studio-force-vector');svg.setAttribute('viewBox','0 0 256 256');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    svg.setAttribute('role','img');svg.setAttribute('aria-label',`Applied force direction: ${sample.label.split(' · ')[1]}`);
    const [x,y]=sample.from,[tx,ty]=sample.to,angle=Math.atan2(ty-y,tx-x),size=9;
    svg.innerHTML=`<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/><path d="M ${tx-size*Math.cos(angle-.6)} ${ty-size*Math.sin(angle-.6)} L ${tx} ${ty} L ${tx-size*Math.cos(angle+.6)} ${ty-size*Math.sin(angle+.6)}"/><circle cx="${x}" cy="${y}" r="3"/><text x="${(x+tx)/2+5}" y="${(y+ty)/2-8}">F</text>`;
    video.after(svg);grid.append(card);
    return {video,svg,timer:null,visible:false,internalPause:false};
   });
   section.append(grid,foot);
   const cancel=preview=>{clearTimeout(preview.timer);preview.timer=null;};
   const pause=preview=>{
    cancel(preview);
    if(!preview.video.paused){preview.internalPause=true;preview.video.pause();}
   };
   const start=preview=>{
    cancel(preview);const {video,svg}=preview;
    if(!preview.visible || video.dataset.studioPaused==='true')return;
    const play=()=>video.play().catch(()=>{video.dataset.studioPaused='true';syncButton();});
    if(video.ended)video.currentTime=0;
    if(video.currentTime<.05){svg.removeAttribute('hidden');preview.timer=setTimeout(play,1400);}
    else play();
   };
   const syncButton=()=>{
    const paused=previews.every(p=>p.video.dataset.studioPaused==='true');
    button.dataset.paused=String(paused);button.textContent=paused?'Play videos':'Pause videos';
   };
   const button=makeButton('Pause videos',()=>{
    const shouldPause=button.dataset.paused!=='true';
    previews.forEach(p=>{p.video.dataset.studioPaused=String(shouldPause);if(shouldPause)pause(p);else start(p);});syncButton();
   }); if(reducedMotion){button.dataset.paused='true';button.textContent='Play videos';} head.append(button);
   initForcePreviews.push(()=>{
    const forceObserver=new IntersectionObserver(entries=>entries.forEach(({target:video,isIntersecting})=>{
     const preview=previews.find(p=>p.video===video);preview.visible=isIntersecting;
     if(isIntersecting)start(preview);else pause(preview);
    }),{threshold:.25});
    previews.forEach(preview=>{
     const {video,svg}=preview;
     video.addEventListener('playing',()=>{cancel(preview);svg.setAttribute('hidden','');video.dataset.studioPaused='false';syncButton();});
     video.addEventListener('pause',()=>{
      if(!preview.internalPause && !video.ended){video.dataset.studioPaused='true';syncButton();}
      preview.internalPause=false;
     });
     video.addEventListener('ended',()=>{video.currentTime=0;svg.removeAttribute('hidden');start(preview);});
     forceObserver.observe(video);
    });
   });
  },
  rewardflow:()=>{
   const section=el('section','studio-feature');section.setAttribute('aria-label','RewardFlow image editing');nav.after(section);
   const body=el('div','studio-image-feature'); const frame=el('div','studio-media-card'); const image=el('img'); image.src='static/images/abstract_diagram.png'; image.alt='RewardFlow image editing examples'; frame.append(image);zoomable(image,frame);
   const copy=el('div'); copy.append(el('div','studio-small','INVERSION-FREE IMAGE EDITING'),el('h2','','One instruction. Multiple rewards. Precise edits.'),el('p','','RewardFlow combines semantic, perceptual, regional, object-level, and human-preference signals to steer editing and generation at inference time.'));
   const tags=el('div','studio-tags'); ['Semantic alignment','Localized edits','No fine-tuning'].forEach(text=>tags.append(el('span','',text))); copy.append(tags);body.append(frame,copy);section.append(body);
  }
 };
 if(['egoforge','hallusegbench','mmplanner','mtsbench','prima','pyratok','silsa','spatialreasoner'].includes(slug)) {
  custom[slug]();
 } else if(slug==='editvid') {
  // Keep the original six comparison cards and their live slider controls.
  const showcase=main.querySelector('#showcase');
  showcase.classList.remove('hero','teaser');showcase.classList.add('section','studio-opening-examples');
  nav.after(showcase);
 } else if(sectionSpec?.opening) {
  projectExamples(sectionSpec.opening);
 } else if(main.querySelector('.studio-overview')) {
  const overview=main.querySelector('.studio-overview');const heading=overview.querySelector(':scope > h3');
  const {section,foot}=featureBase(heading.textContent,'Benchmark comparisons appear in the results section below.');
  // Show the original teaser as well as its accessible text explanation.
  if(originalTeaser) {
   const frame=el('div','studio-overview-figure');originalTeaser.loading='eager';frame.append(originalTeaser);
   zoomable(originalTeaser,frame);section.append(frame);
  }
  heading.remove();section.append(overview,foot);
 } else if(custom[slug])custom[slug]();
 else {
  const source=main.querySelector('.teaser img, .section img');
  if(source && !source.src.includes('logo.svg')) {
   const label=slug==='3d-vcd'?'Grounded answers. Fewer hallucinations.':'Overview';
   const note=slug==='3d-vcd'?'3D-VCD contrasts predictions from observed and distorted scene graphs to suppress unsupported answers without retraining.':source.alt || 'Original project figure';
   const {section,foot}=featureBase(label,note);
   const frame=el('div','studio-media-card'); frame.style.padding='24px'; const image=source.cloneNode(); image.removeAttribute('style');image.style.width='100%';image.loading='eager';
   if(slug==='3d-vcd')image.alt='3D-VCD contrasts predictions from observed and distorted 3D scene graphs.';
   frame.append(image);zoomable(image,frame);section.append(frame,foot);
  }
 }
 // Put the interactive models themselves first, and keep their explanation
 // with the method. Move the existing nodes so camera controls stay intact.
 if(slug==='core3d' || slug==='dreampartgen') {
  const models=main.querySelector('#studio-interactive-models');
  const diagram=main.querySelector(':scope > .studio-feature');
  const method=main.querySelector('[data-studio-section="method"] > .container');
  if(diagram && method) {
   const overview=el('div','studio-subsection studio-model-overview');
   diagram.querySelectorAll('.core3d-label,.dreampartgen-label').forEach(label=>label.remove());
   const oldTitle=diagram.querySelector('h2');
   const heading=el('h3','title is-4',oldTitle.textContent);heading.id=oldTitle.id;oldTitle.replaceWith(heading);
   overview.append(...diagram.childNodes);method.querySelector('h2').after(overview);diagram.remove();
   if(slug==='core3d')window.PLANCore3D.polishMethod(main);
  }
  models.classList.add('studio-model-examples');models.dataset.studioSection='examples';nav.after(models);
  models.querySelectorAll('model-viewer').forEach(viewer=>{
   const loaded=()=>viewer.classList.add('studio-model-loaded');
   if(viewer.loaded)loaded();else viewer.addEventListener('load',loaded,{once:true});
  });
 }
 if(slug==='graphvid') {
  const why=[...main.querySelectorAll(':scope > section')].find(section=>section.querySelector('h2')?.textContent==='Why Graph-Based Video Control?');
  if(why) {why.dataset.studioSection='motivation';why.classList.add('studio-explanation-panel');}
 }
 // Use EditVid's quiet card treatment for explanatory cards throughout.
 main.querySelectorAll('.method-grid,.why-grid,[data-studio-section="method"] :is(.palm-card-grid,.feature-grid,.studio-overview-steps)').forEach(grid=>{
  grid.classList.add('studio-explainer-grid');
  [...grid.children].forEach((card,index)=>{
   card.classList.add('studio-explainer-card');
   if(!card.querySelector('i')) {
    const icon=el('i',`fa-solid ${['fa-link','fa-crosshairs','fa-layer-group'][index%3]}`);icon.setAttribute('aria-hidden','true');card.prepend(icon);
   }
  });
 });
 // Start with one compact summary strip, then the existing examples or figure.
 const summary=main.querySelector('[data-studio-section="tldr"]');
 const opening=main.querySelector(':scope > .studio-feature, :scope > .studio-opening-examples, :scope > .studio-model-examples');
 const openingTitles={VisAnom:'Anomaly localization and explanation',calico:'Multi-image co-segmentation',cogniroute:'Evidence selection for social reasoning',graphvid:'Graph-guided motion control',rewardflow:'Reward-guided image editing','3d-vcd':'Hallucination mitigation in 3D scenes'};
 const openingTitle=opening?.querySelector('h2');
 if(openingTitle && openingTitles[slug])openingTitle.textContent=openingTitles[slug];
 opening?.querySelectorAll('.studio-media-label b').forEach(index=>index.remove());
 if(slug==='rewardflow')opening?.querySelector('.studio-image-feature h2')?.remove();
 // Remaining legacy teasers belong to the method, not an unnamed opening panel.
 main.querySelectorAll(':scope > .hero.teaser, :scope > section:not(.studio-header):not(.studio-feature):not(.studio-opening-examples):not([data-studio-section])').forEach(teaser=>{
  const method=main.querySelector('[data-studio-section="method"] > .container');
  const body=teaser.querySelector('.hero-body') || teaser.querySelector(':scope > .container');
  if(!method || !body)return;
  const context=el('div','studio-subsection studio-teaser-context');context.append(...body.childNodes);
  if(context.textContent.trim() || context.querySelector('img,video,iframe,model-viewer'))method.append(context);
  teaser.remove();
 });
 if(summary) {
  summary.classList.add('studio-opening-summary');
  const list=summary.querySelector('.studio-tldr-box > ul');
  if(list) {
   const paragraph=el('p');
   [...list.children].forEach((item,index)=>{
    if(index)paragraph.append(document.createTextNode(' '));
    paragraph.append(...item.childNodes);
   });
   list.replaceWith(paragraph);
  }
  summary.querySelectorAll('.studio-tldr-box p').forEach(paragraph=>{
   const text=paragraph.textContent,words=[...text.matchAll(/\S+/g)];
   if(words.length<3)return;
   const start=words.at(-2).index,tail=el('span','studio-tldr-tail',text.slice(start).replace(/\s+/g,'\u00a0'));
   // Keep the closing words together; hyphenated terms can still break on a
   // small screen, so this does not force a wide unbreakable phrase.
   paragraph.replaceChildren(document.createTextNode(text.slice(0,start)),tail);
  });
  hero.after(summary);
  if(opening) {opening.dataset.studioSection='examples';summary.after(opening);opening.after(nav);}
  else summary.after(nav);
 }
 // Keep one section heading; opening cards use a compact caption label.
 main.querySelectorAll(':scope > section:not(.studio-header) .section-kicker, .studio-feature :is(.visanom-label,.calico-label,.cogniroute-label,.core3d-label,.dash-label,.dreampartgen-label,.ecvlm-label,.ece-label,.studio-small)').forEach(label=>label.remove());
 // Figure openings follow the video cards: media first, then a quiet caption.
 if(opening && ['calico','cogniroute','dash','ec-vlm'].includes(slug)) {
  const figure=opening.querySelector(':scope > figure');
  const heading=opening.querySelector(':scope > h2');
  const original=figure.querySelector(':scope > figcaption') || opening.querySelector(':scope > .calico-task-caption');
  const caption=el('figcaption','studio-opening-caption');
  heading.classList.add('studio-opening-label');caption.append(heading);
  const notes=[...opening.querySelectorAll(':scope > p')];
  if(sectionSpec.openingCaption) {
   caption.append(el('p','',sectionSpec.openingCaption));original?.remove();notes.forEach(note=>note.remove());
  } else {
   notes.filter(note=>note.className.includes('intro')).forEach(note=>caption.append(note));
   if(original) {
    const text=el('div','studio-opening-description');text.append(...original.childNodes);caption.append(text);original.remove();
   }
   notes.filter(note=>!note.className.includes('intro')).forEach(note=>caption.append(note));
  }
  const toolbar=figure.querySelector(':scope > [class$="-toolbar"]');if(toolbar)caption.prepend(toolbar);
  figure.append(caption);opening.classList.add('studio-figure-opening');
 }
 if(opening && slug==='3d-vcd') {
  const head=opening.querySelector('.studio-feature-head'),foot=opening.querySelector('.studio-feature-foot');
  const copy=el('div','studio-opening-caption-copy'),heading=head.querySelector('h2');
  heading.classList.add('studio-opening-label');copy.append(heading,...foot.childNodes);
  foot.append(copy,...head.children);head.remove();
 }
 if(slug==='phantom') {
  const head=opening.querySelector('.studio-feature-head'),foot=opening.querySelector('.studio-feature-foot');
  head.querySelector('h2').remove();foot.append(...head.children);head.remove();
  foot.querySelector('p').remove();
  opening.classList.add('studio-force-examples');
  const heading=el('h2','studio-opening-label','Force prompting examples');
  heading.id='studio-force-prompting';foot.prepend(heading);opening.setAttribute('aria-labelledby',heading.id);
  opening.querySelectorAll('.studio-media-label').forEach(label=>label.remove());
 }
 if(slug==='egoforge' && !opening.classList.contains('egoforge-video-examples')) {
  const box=opening.querySelector(':scope > .container'),body=box.querySelector('.hero-body');
  const caption=el('div','studio-opening-caption'),heading=box.querySelector(':scope > h2');
  heading.classList.add('studio-opening-label');caption.append(heading,...body.querySelectorAll(':scope > p'));body.append(caption);
  opening.classList.add('studio-figure-opening');
 }
 if(slug==='ece') {
  const heading=opening.querySelector(':scope > h2'),caption=opening.querySelector('.ece-figure figcaption');
  const description=el('p');description.append(...caption.childNodes);
  heading.classList.add('studio-opening-label');caption.append(heading,description);
 }
 if(slug==='latte-flow') {
  // The core-idea diagram now opens the page; the method keeps the architecture.
  main.querySelectorAll('[data-studio-section="method"] img[src$="diffusion_process_fig.png"]').forEach(image=>image.closest('.fig-block')?.remove());
 }
 // Keep original figures uncropped; expose a keyboard-operable zoom action on media cards.
 main.querySelectorAll('.media-card').forEach(frame=>{
  if(frame.classList.contains('studio-media-card'))return;
  const image=frame.querySelector(':scope > img'); if(image) { frame.style.position='relative'; zoomable(image,frame); }
 });
 main.querySelectorAll('table:not(.studio-native-table)').forEach(table=>{
  const parent=table.parentElement;
  const reuse=parent.matches('div') && parent.children.length===1 && /auto|scroll/.test(getComputedStyle(parent).overflowX);
  const scroll=reuse?parent:el('div');scroll.classList.add('studio-table-scroll');scroll.tabIndex=0;
  scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Scrollable project results table');
  if(reuse)scroll.style.removeProperty('margin-bottom');else {table.before(scroll);scroll.append(table);}
 });
 main.querySelectorAll('h3').forEach(heading=>{
  let before=heading.previousElementSibling;
  while(before && !before.matches('h2,h3')) {
   if(before.matches('table,.studio-native-result,.studio-subsection') || before.querySelector('table,.studio-native-result')) {heading.classList.add('studio-next-result');break;}
   before=before.previousElementSibling;
  }
 });
 main.querySelectorAll('.section br').forEach(lineBreak=>{
  const before=lineBreak.previousElementSibling,after=lineBreak.nextElementSibling;
  if(before?.matches('div,p,figure,table,h2,h3,br') && after?.matches('div,p,figure,table,h2,h3,br'))lineBreak.remove();
 });
 await window.PLANResults.format(main,slug,zoomable);
 // Offscreen videos stop decoding. Reduced motion requires explicit playback.
 const observer=new IntersectionObserver(entries=>entries.forEach(({target:video,isIntersecting})=>{
  if(!isIntersecting) video.pause();
  else if(!reducedMotion && video.dataset.studioAutoplay==='true' && video.dataset.studioPaused!=='true')video.play().catch(()=>{});
 }),{threshold:.15});
 main.querySelectorAll('video').forEach(video=>{
  // EditVid manages its synchronized comparison row, including newly selected edits.
  if(!(slug==='editvid' && video.closest('#video-grid'))) {
   const originalAutoplay=video.autoplay;video.removeAttribute('autoplay');video.pause();video.controls=true;video.preload='metadata';video.playsInline=true;
   if(originalAutoplay || slug==='palm')video.dataset.studioAutoplay='true';
   if(slug==='palm'){video.muted=true;video.loop=true;video.setAttribute('muted','');}
   if(!video.dataset.forcePreview)observer.observe(video);
  }
  video.addEventListener('error',()=>{
   if(video.parentElement.querySelector('.studio-error'))return;
   video.after(el('p','studio-error','This video file is unavailable in the current project.'));
  });
 });
 initForcePreviews.forEach(init=>init());
 // Expansion controls are removed after project modules finish arranging figures.
 main.querySelectorAll('.studio-zoom,.zoom-label').forEach(button=>button.remove());
 main.querySelectorAll('button[data-enlarge]').forEach(button=>button.replaceWith(...button.childNodes));
 document.querySelector('#image-dialog')?.remove();
 main.querySelectorAll('[class$="-toolbar"]').forEach(toolbar=>{if(!toolbar.textContent.trim() && !toolbar.children.length)toolbar.remove();});
 lightbox.remove();
 main.dataset.studioPresentationReady='true';
 // Every proposal shares the same PLAN footer. Retain legacy license notices separately.
 try {
  const response=await fetch('../../assets/components/project-footer.html?v='+assetVersion);
  if(!response.ok) throw new Error(`Footer HTTP ${response.status}`);
  const footer=new DOMParser().parseFromString(await response.text(),'text/html').querySelector('footer');
  if(footer) {
   const credits=[];
   document.querySelectorAll('footer').forEach(old=>{
    const notice=old.querySelector('a[rel="license"]');
    if(notice) {
     const p=notice.closest('p'); if(p) credits.push(p.cloneNode(true));
    }
    old.remove();
   });
   if(credits.length) {
    const details=el('details','studio-attribution');details.append(el('summary','','Template acknowledgements'));
    details.append(...credits);main.append(details);
   }
   footer.querySelectorAll('a[href]').forEach(link=>{
    const href=link.getAttribute('href');
    if(href && !/^(https?:|mailto:|tel:)/.test(href)) link.href=new URL(`../../${href}`,location.href).href;
   });
   main.after(footer);
  }
 } catch(error) { console.error('[PLAN] Shared footer failed to load',error); }
})();
