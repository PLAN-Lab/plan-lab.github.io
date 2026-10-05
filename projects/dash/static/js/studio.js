/* DaSH's opt-in presentation preserves the paper's text and reported scores. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 let teaserImage;
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=el('link');style.rel='stylesheet';style.href='static/css/studio.css?v=project-pages-inline-data-v2';
   style.onload=resolve;style.onerror=()=>reject(new Error('DaSH presentation styles unavailable'));document.head.append(style);
  });
  const title=main.querySelector('.studio-header .publication-title');
  const first=el('span','dash-title-line','Hierarchical Dataset Selection ');
  const second=el('span','dash-title-line','for ');second.append(el('span','dash-title-phrase','High-Quality'),document.createTextNode(' '),el('span','dash-title-phrase','Data Sharing'));
  title.querySelector('.studio-subtitle').replaceChildren(first,second);
  const venue=main.querySelector('.studio-header .publication-venue') || el('p','publication-venue','AAAI 2026 (Oral)');
  main.querySelector('.studio-header .studio-affiliations').after(venue);

  // Move the original teaser into a single opening figure.
  const teaser=main.querySelector('.hero.teaser');
  teaserImage=teaser.querySelector('img');
  teaserImage.removeAttribute('style');teaserImage.loading='eager';
  teaserImage.alt='DaSH selects relevant datasets by reasoning over groups and datasets, compared with instance-level active learning and subset selection.';
  teaser.remove();
  main.querySelector('[data-studio-section="method"] img').alt='DaSH selects a group and a dataset, observes a reward, and updates both utility distributions.';

  const pareto=main.querySelector('[data-result-source="static/images/pareto.png"]');
  pareto.nextElementSibling.remove();pareto.remove();

  main.querySelectorAll('[data-studio-section="quantitative"] .studio-native-result').forEach(figure=>{
   const table=figure.querySelector('table');
   table.querySelectorAll('tbody tr').forEach(row=>{
    const method=row.cells[0];method.textContent=method.textContent.replace(/\s+\([^)]*\)$/, '');
    if(method.textContent==='DaSH')row.classList.add('studio-ours');
    [...row.cells].slice(2).forEach(cell=>{
     const match=cell.textContent.match(/^(.*?)(\s+[↑↓]\s*[\d.]+)$/);
     if(match)cell.replaceChildren(document.createTextNode(match[1]),el('span','studio-metric-gain',match[2]));
    });
   });
   const caption=figure.nextElementSibling;
   const walker=document.createTreeWalker(caption,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode()))node.textContent=node.textContent
    .replace('Red downward arrows','Orange downward arrows beside scores')
    .replace('absolute drops in accuracy relative to the best-performing method','accuracy drops relative to DaSH, in percentage points')
    .replace(/absolute drops in accuracy\s+relative to the best-performing method/,'accuracy drops relative to DaSH, in percentage points')
    .replace('only 0.5% below','only 0.5 percentage points below')
    .replace('3.3–10.8%','3.3–10.8 percentage points');
   // The paper emphasizes DaSH; Global is the upper bound, not a selection method.
   const boldLabel=[...caption.childNodes].find(n=>n.nodeType===Node.TEXT_NODE && n.textContent.includes('Best performance is '));
   if(boldLabel)boldLabel.textContent=boldLabel.textContent.replace('Best performance is ','DaSH results are ');
   caption.querySelectorAll('span').forEach(span=>{if(span.textContent.trim()==='↓')span.classList.add('dash-model-name');});
   caption.classList.add('dash-result-caption');figure.querySelector('h3').after(caption);
   figure.querySelector('.studio-result-note')?.remove();
  });
  main.querySelectorAll('b,strong,.studio-method-name').forEach(node=>{
   if(node.textContent.trim()==='DaSH' && !node.closest('[data-studio-section="abstract"],[data-studio-section="qualitative"]'))node.classList.add('dash-model-name');
  });
 }
 function feature({nav,zoomable}) {
  const section=el('section','studio-feature dash-feature');section.setAttribute('aria-labelledby','dash-feature-title');
  const title=el('h2','','Dataset Selection via Hierarchies');title.id='dash-feature-title';
  section.append(el('div','dash-label','Hierarchical dataset selection'),title,el('p','dash-feature-intro','DaSH selects entire datasets from heterogeneous external sources to improve a local model. It models utility at both group and dataset levels to guide selection under limited exploration budgets.'));
  const figure=el('figure','dash-figure');const caption=el('figcaption','','Instance-level methods ignore dataset structure. DaSH uses hierarchical grouping to identify relevant datasets and avoid noisy sources.');
  figure.append(teaserImage,caption);section.append(figure);nav.after(section);
  zoomable(teaserImage,figure);
  const button=figure.querySelector('.studio-zoom'),icon=el('i','fa-solid fa-expand');icon.setAttribute('aria-hidden','true');button.replaceChildren(document.createTextNode('Expand'),icon);
  const toolbar=el('div','dash-figure-toolbar');toolbar.append(button);figure.append(toolbar);
 }
 window.PLANDaSH={prepare,feature};
})();
