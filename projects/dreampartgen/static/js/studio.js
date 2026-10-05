/* DreamPartGen's opt-in presentation retains its original figures and 3D assets. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 function rank(cells,lowerIsBetter) {
  const values=cells.map(cell=>Number(cell.textContent.trim()));
  const ranks=[...new Set(values.filter(Number.isFinite))].sort((a,b)=>lowerIsBetter?a-b:b-a);
  cells.forEach((cell,index)=>{
   if(!Number.isFinite(values[index]))return;
   const place=values[index]===ranks[0]?'best':values[index]===ranks[1]?'second':null;
   if(!place)return;
   const mark=el(place==='best'?'strong':'u',`dreampartgen-${place}`);mark.append(...cell.childNodes);cell.append(mark);
  });
 }
 function figure(image,description) {
  const frame=el('figure','dreampartgen-figure');const caption=image.nextElementSibling;
  image.removeAttribute('style');image.removeAttribute('width');image.removeAttribute('height');
  image.before(frame);frame.append(image);
  if(description)frame.append(el('figcaption','',description));
  else if(caption?.tagName==='P' && caption.textContent.trim()) {
   const label=el('figcaption');label.append(...caption.childNodes);caption.remove();frame.append(label);
  }
  return frame;
 }
 function models(main) {
  const viewers=[...main.querySelectorAll('model-viewer')];
  const previous=viewers[0].closest('.studio-subsection');
  const section=el('section','section');section.id='studio-interactive-models';section.dataset.studioSection='interactive';section.setAttribute('aria-labelledby','dreampartgen-models-title');
  const box=el('div','container is-max-desktop');const title=el('h2','title is-3','Interactive 3D Models');title.id='dreampartgen-models-title';
  box.append(title,el('p','dreampartgen-model-instructions','Drag to rotate. Scroll or pinch to zoom. Use the arrow keys when a model is focused.'));
  const grid=el('div','dreampartgen-model-grid');
  const names=['Astronaut','Sheep','Space jet','Speaker','Unicorn','Cannon','Fire hydrant','Rifle','Trophy','Panda character','Butterfly','Car'];
  viewers.forEach((viewer,index)=>{
   viewer.removeAttribute('style');viewer.removeAttribute('auto-rotate');viewer.removeAttribute('autoplay');viewer.removeAttribute('animation-name');
   const orbit=index===7?'90deg 75deg 105%':'35deg 75deg 105%';viewer.setAttribute('camera-orbit',orbit);
   viewer.setAttribute('loading','lazy');viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('interaction-prompt','none');viewer.setAttribute('alt',`DreamPartGen: ${names[index].toLowerCase()}. Drag or use the arrow keys to rotate; scroll or pinch to zoom.`);
   const card=el('article','dreampartgen-model-card');card.append(viewer);
   const reset=el('button','studio-control','Reset view');reset.type='button';reset.setAttribute('aria-label',`Reset ${names[index].toLowerCase()} view`);
   reset.disabled=!viewer.loaded;viewer.addEventListener('load',()=>{reset.disabled=false;},{once:true});
   reset.addEventListener('click',()=>{
    viewer.cameraOrbit=orbit;viewer.cameraTarget='auto auto auto';viewer.fieldOfView='auto';
    ['cameraOrbit','cameraTarget','fieldOfView'].forEach(property=>viewer.requestUpdate(property));viewer.jumpCameraToGoal();
   });card.append(reset);grid.append(card);
  });
  previous.remove();box.append(grid);section.append(box);main.querySelector('[data-studio-section="method"]').after(section);
 }
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=el('link');style.rel='stylesheet';style.href='static/css/studio.css?v=project-pages-inline-data-v2';
   style.onload=resolve;style.onerror=()=>reject(new Error('DreamPartGen presentation styles unavailable'));document.head.append(style);
  });
  const venue=main.querySelector('.studio-header .publication-venue') || el('p','publication-venue');venue.textContent='ECCV 2026';
  main.querySelector('.studio-header .studio-affiliations').after(venue);
  const subtitle=main.querySelector('.studio-subtitle'),ending='Latent Denoising';
  subtitle.replaceChildren(document.createTextNode(subtitle.textContent.slice(0,-ending.length)),el('span','dreampartgen-title-phrase',ending));

  const method=main.querySelector('[data-studio-section="method"] .content'),methodImage=method.querySelector('img');
  method.querySelectorAll('p').forEach(p=>p.remove());
  methodImage.before(el('p','','DreamPartGen treats part-based 3D generation as a collaborative diffusion process. Geometric and visual representations are refined together with language-derived relationships, so individual parts remain consistent with both the prompt and the assembled object.'));
  figure(methodImage,'Synchronized denoising aligns each part’s geometry and appearance with local and global semantic relationships.');
  const schema=el('dl','dreampartgen-schema');
  [
   ['Duplex Part Latents (DPLs)','These latents encode each part’s geometry and appearance in modular, disentangled representations. They preserve the correspondence between the 3D part and its visual features.','dreampartgen-dpl'],
   ['Relational Semantic Latents (RSLs)','These compact, text-derived tokens carry local refinements and global planning signals, including how parts should relate to one another. They remain active throughout denoising.','dreampartgen-rsl'],
   ['Synchronized co-denoising','Intra-part attention aligns geometry and appearance within each part. Inter-part attention coordinates relationships across parts, allowing language to guide a coherent assembly.']
  ].forEach(([name,description,cls])=>schema.append(el('dt',cls,name),el('dd','',description)));method.append(schema);

  const dataset=main.querySelector('[data-studio-section="dataset"] .content'),datasetImage=dataset.querySelector('img');
  const explanation=[...dataset.querySelectorAll('p')].find(p=>p.textContent.trim());datasetImage.before(explanation);
  dataset.querySelectorAll('p').forEach(p=>{if(!p.textContent.trim())p.remove();});
  const stats=el('dl','dreampartgen-dataset-stats');
  [['300K','Canonicalized functional and spatial triplets'],['175','Object categories']].forEach(([value,label])=>{const item=el('div');item.append(el('dt','',value),el('dd','',label));stats.append(item);});datasetImage.before(stats);
  figure(datasetImage,'PartRel3D links object parts through functional dependencies and spatial relationships.');

  models(main);
  const results=main.querySelector('[data-studio-section="quantitative"]');
  const takeaway=el('p','dreampartgen-result-takeaway','DreamPartGen achieves the lowest CD and EMD on all four generation benchmarks and the strongest text–shape alignment at both object and part levels.');results.querySelector('h2').after(takeaway);
  results.querySelectorAll('.studio-native-result').forEach((result,index)=>{
   const table=result.querySelector('table'),headers=[...table.tHead.rows[0].cells];
   [...table.tBodies].forEach(body=>{
    const rows=[...body.rows].filter(row=>!row.classList.contains('studio-group'));
    headers.slice(1).forEach((header,column)=>rank(rows.map(row=>row.cells[column+1]),header.textContent.includes('↓')));
   });
   if(index===0) {
    const first=el('tr'),second=el('tr'),methodHeader=el('th','','Method');methodHeader.rowSpan=2;methodHeader.scope='col';first.append(methodHeader);
    ['Objaverse','ShapeNet','ABO','PartRel3D'].forEach(name=>{const group=el('th','',name);group.colSpan=3;group.scope='colgroup';first.append(group);['CD ↓','EMD ↓','IoU ↓'].forEach(label=>{const metric=el('th','',label);metric.scope='col';second.append(metric);});});
    table.tHead.replaceChildren(first,second);result.classList.add('dreampartgen-generation-result');
   }
   result.nextElementSibling.remove();
   const caption=el('p','dreampartgen-result-caption',index===0?'Object generation across four benchmarks. Lower scores are better. ':'Text–shape alignment at object and part levels. Higher scores are better. ');
   caption.append(document.createTextNode('Best results are '),el('strong','','bold'),document.createTextNode('; second-best results are '),el('u','','underlined'),document.createTextNode('.'));result.querySelector('h3').after(caption);
  });

  const qualitative=main.querySelector('[data-studio-section="qualitative"]');figure(qualitative.querySelector('img'));
  const generation=[...qualitative.querySelectorAll('.studio-subsection')].find(section=>section.querySelector('.video-grid'));
  const heading=generation.querySelector('h3'),videos=generation.querySelector('.video-grid');
  generation.replaceChildren(heading,el('p','dreampartgen-video-intro','Each pair shows the generated object on the left and its part decomposition on the right. Use the video controls to inspect each example.'),videos);
  videos.querySelectorAll('video').forEach(video=>{
   const filename=new URL(video.src).pathname.split('/').pop().replace(/\.mp4$/, '');
   video.poster=`static/dreampart_posters/${filename}.jpg`;video.loop=true;
   video.setAttribute('aria-label',`${filename.replace(/_r$/, '').replaceAll('_',' ')}: ${filename.endsWith('_r')?'part decomposition':'generated object'}`);
  });
 }
 function feature({main,nav,zoomable}) {
  const section=el('section','studio-feature dreampartgen-feature');section.setAttribute('aria-labelledby','dreampartgen-feature-title');
  const title=el('h2','','Semantically Grounded Part-Level 3D Generation');title.id='dreampartgen-feature-title';
  section.append(el('div','dreampartgen-label','Language-guided part generation'),title,el('p','dreampartgen-feature-intro','DreamPartGen jointly refines part geometry, appearance, and language-derived relationships to generate coherent 3D objects from text.'));
  const frame=el('figure','dreampartgen-figure'),image=el('img');image.src='static/images/teaser_1.png';image.loading='eager';image.alt='DreamPartGen examples of part-aware text-to-3D synthesis, part editing, articulated objects, and mini-scenes.';
  frame.append(image,el('figcaption','','Part-aware text-to-3D generation, part editing, articulated objects, and mini-scene generation.'));section.append(frame);nav.after(section);
  main.querySelectorAll('.dreampartgen-figure').forEach(frame=>{
   const image=frame.querySelector('img');zoomable(image,frame);
   const button=frame.querySelector('.studio-zoom'),icon=el('i','fa-solid fa-expand');icon.setAttribute('aria-hidden','true');button.replaceChildren(document.createTextNode('Expand'),icon);
   const toolbar=el('div','dreampartgen-figure-toolbar');toolbar.append(button);frame.append(toolbar);
  });
 }
 window.PLANDreamPartGen={prepare,feature};
})();
