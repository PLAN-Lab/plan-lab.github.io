/* CoRe3D presentation preserves reported scores, figures, and GLB assets. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 function emphasize(cells,lowerIsBetter) {
  const values=cells.map(cell=>Number(cell.textContent.trim()));
  const ranks=[...new Set(values)].sort((a,b)=>lowerIsBetter?a-b:b-a);
  cells.forEach((cell,index)=>{
   const rank=values[index]===ranks[0]?'best':values[index]===ranks[1]?'second':null;
   if(!rank)return;
   const mark=el(rank==='best'?'strong':'u',`core3d-${rank}`);mark.append(...cell.childNodes);cell.append(mark);
  });
 }
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=el('link');style.rel='stylesheet';style.href='static/css/studio.css?v=project-pages-inline-data-v2';
   style.onload=resolve;style.onerror=()=>reject(new Error('CoRe3D presentation styles unavailable'));document.head.append(style);
  });
  // The Statue of Liberty animation is omitted from this presentation.
  // The planning/construction diagrams remain in Method.
  main.querySelector('.hero.teaser').remove();

  const methodImage=main.querySelector('[data-studio-section="method"] img.interpolation-image');
  methodImage.alt='CoRe3D architecture couples semantic planning and octant-based geometric reasoning through 3D Co-GRPO.';
  methodImage.removeAttribute('style');
  const method=methodImage.closest('.content');methodImage.remove();
  method.replaceChildren(el('p','','CoRe3D couples language-based planning with reasoning over localized 3D blocks. Joint reinforcement learning aligns the semantic plan with the geometry the model constructs.'));
  const steps=el('ul','studio-explainer-grid core3d-method-grid');
  [
   ['Semantic planning','fa-comments','The unified 3D-LLM expands a prompt into a plan for the object’s category, parts, spatial layout, materials, and appearance. The plan anchors the following geometric reasoning.'],
   ['Geometric reasoning','fa-cubes','A 3D VQ-VAE compresses 64³ voxels into 16³ latents. Eight adjacent 8-D latents form each 64-D octant token, giving 512 spatially localized tokens per object.'],
   ['Joint optimization','fa-link','3D Co-GRPO aligns both reasoning levels using four critics: human preference, 3D understanding, text–3D alignment, and physical coherence.']
  ].forEach(([name,iconClass,description])=>{
   const card=el('li','studio-explainer-card'),icon=el('i',`fa-solid ${iconClass}`);icon.setAttribute('aria-hidden','true');
   card.append(icon,el('h3','',name),el('p','',description));steps.append(card);
  });method.append(steps,el('h3','title is-4','Joint optimization with 3D Co-GRPO'));
  const architecture=el('figure','core3d-figure core3d-method-architecture');
  architecture.append(methodImage,el('figcaption','','Multi-view critic rewards refine semantic plans and geometric reasoning together.'));method.append(architecture);

  // Every table compares models in rows; rank each metric column, respecting ↓.
  main.querySelectorAll('[data-studio-section="quantitative"] .studio-native-result').forEach((figure,index)=>{
   const table=figure.querySelector('table'),rows=[...table.tBodies[0].rows];
   [...table.tHead.rows[0].cells].slice(1).forEach((header,column)=>emphasize(rows.map(row=>row.cells[column+1]),header.textContent.includes('↓')));
   const caption=figure.nextElementSibling;
   if(index===0)caption.replaceChildren(document.createTextNode('Language understanding and reasoning benchmarks for vision-language and 3D models. Higher scores are better. '));
   else {
    const oldLegend=caption.querySelector('.best-highlight');
    const tail=document.createRange();tail.setStartBefore(oldLegend);tail.setEnd(caption,caption.childNodes.length);tail.deleteContents();
   }
   caption.append(document.createTextNode('Best results are '),el('strong','','bold'),document.createTextNode('; second-best results are '),el('u','','underlined'),document.createTextNode('.'));
   caption.classList.add('core3d-result-caption');figure.querySelector('h3').after(caption);
  });

  // Preserve the existing viewer nodes before rebuilding their old container.
  const viewers=[...main.querySelectorAll('model-viewer')];
  const previousSection=viewers[0].closest('.studio-subsection');
  // Each qualitative group introduces its task before the original media.
  const qualitative=main.querySelector('[data-studio-section="qualitative"]'),box=qualitative.querySelector(':scope > .container');
  const qualitativeTitle=qualitative.querySelector('h2'),images=[...qualitative.querySelectorAll('img')];
  images.forEach(image=>{image.removeAttribute('style');image.removeAttribute('width');image.removeAttribute('height');});
  const examples=el('div','content core3d-qualitative');box.replaceChildren(qualitativeTitle,examples);
  const group=(name,description)=>{
   const section=el('article','core3d-qual-group'),header=el('header');header.append(el('h3','title is-4',name),el('p','',description));section.append(header);examples.append(section);return section;
  };
  const challenging=group('Reasoning from indirect descriptions','CoRe3D identifies an object from implicit cues, then uses semantic reasoning to guide its 3D construction. Each example pairs the description with the reasoning trace and generated shape.');
  const challenges=el('div','core3d-challenge-list');
  [
   ['Lotus flower','A flower representing purity and spiritual awakening in Buddhism.'],
   ['Mooncake','A golden-brown, round pastry associated with the moon.'],
   ['Matryoshka doll','A wooden figure that opens to reveal a sequence of smaller figures.']
  ].forEach(([name,description],index)=>{
   const card=el('article','core3d-challenge-case'),copy=el('header');copy.append(el('h4','',name),el('p','',description));
   const image=images[index];image.alt=`CoRe3D semantic reasoning and generated ${name.toLowerCase()} from an indirect description.`;
   const figure=el('figure','core3d-figure');figure.append(image);card.append(copy,figure);challenges.append(card);
  });challenging.append(challenges);
  [
   ['Image-to-3D generation','Single-image inputs and generated shapes from CoRe3D, ShapeLLM-Omni, Trellis, CLAY, and SAR3D.',images[3],'Image-to-3D comparison: input images and multi-view renderings from CoRe3D and four baseline methods.'],
   ['Text-to-3D generation','Shared text prompts and multi-view results compare how each method follows the requested object and attributes.',images[4],'Text-to-3D comparison: identical object descriptions and multi-view renderings from CoRe3D and four baseline methods.'],
   ['Instruction-guided part editing','CoRe3D uses collaborative reasoning to interpret the edit instruction and modify the requested part of a 3D object.',images[5],'Instruction-guided 3D part editing with CoRe3D.']
  ].forEach(([name,description,image,alt])=>{
   const section=group(name,description),figure=el('figure','core3d-figure');image.alt=alt;figure.append(image);section.append(figure);
  });

  // Move the same eight model nodes out of the qualitative subsection.
  const section=el('section','section');section.id='studio-interactive-models';section.dataset.studioSection='interactive';section.setAttribute('aria-labelledby','core3d-models-title');
  const container=el('div','container is-max-desktop');const title=el('h2','title is-3','Interactive 3D Models');title.id='core3d-models-title';
  container.append(title,el('p','core3d-model-instructions','Drag to rotate. Scroll or pinch to zoom. Use the arrow keys when a model is focused.'));
  const grid=el('div','core3d-model-grid');
  const names=['Mechanical robot','Pagoda','Plant-covered tracked vehicle','Railcar','Cartoon astronaut','Building','Excavator','Pirate ship'];
  viewers.forEach((viewer,index)=>{
   viewer.removeAttribute('style');viewer.removeAttribute('auto-rotate');viewer.removeAttribute('autoplay');viewer.removeAttribute('animation-name');
   viewer.setAttribute('loading','lazy');viewer.setAttribute('touch-action','pan-y');viewer.setAttribute('interaction-prompt','none');viewer.setAttribute('alt',`CoRe3D: ${names[index].toLowerCase()}. Drag or use the arrow keys to rotate; scroll or pinch to zoom.`);
   const card=el('article','core3d-model-card');card.append(viewer);
   const reset=el('button','studio-control','Reset view');reset.type='button';reset.setAttribute('aria-label',`Reset ${names[index].toLowerCase()} view`);
   reset.disabled=!viewer.loaded;viewer.addEventListener('load',()=>{reset.disabled=false;},{once:true});
   reset.addEventListener('click',()=>{
    viewer.cameraOrbit='0deg 75deg 105%';viewer.cameraTarget='auto auto auto';viewer.fieldOfView='auto';
    // User controls change the camera without changing these property strings.
    // Request their update explicitly so Reset also works on repeated clicks.
    ['cameraOrbit','cameraTarget','fieldOfView'].forEach(property=>viewer.requestUpdate(property));
    viewer.jumpCameraToGoal();
   });card.append(reset);grid.append(card);
  });
  previousSection.remove();container.append(grid);section.append(container);main.querySelector('[data-studio-section="method"]').after(section);
 }
 function feature({main,nav,zoomable}) {
  const section=el('section','studio-feature core3d-feature');section.setAttribute('aria-labelledby','core3d-feature-title');
  const title=el('h2','','From semantic plans to localized 3D blocks');title.id='core3d-feature-title';section.append(title);
  const figure=el('figure','core3d-figure');const image=el('img');image.src='static/images/teaser.png';image.alt='Semantic reasoning plans an object’s parts and layout; geometric reasoning constructs the corresponding shape over 3D octant tokens.';image.loading='eager';
  figure.append(image,el('figcaption','','Semantic reasoning plans the object’s structure; geometric reasoning constructs the corresponding 3D blocks.'));section.append(figure);nav.after(section);
  main.querySelectorAll('.core3d-figure').forEach(frame=>{
   const media=frame.querySelector('img');zoomable(media,frame);
   const button=frame.querySelector('.studio-zoom'),icon=el('i','fa-solid fa-expand');icon.setAttribute('aria-hidden','true');button.replaceChildren(document.createTextNode('Expand'),icon);
   const toolbar=el('div','core3d-figure-toolbar');toolbar.append(button);frame.append(toolbar);
  });
 }
 function polishMethod(main) {
  const method=main.querySelector('[data-studio-section="method"] .content');
  const overview=main.querySelector('[data-studio-section="method"] .studio-model-overview');
  method.querySelector('.core3d-method-grid').after(overview);
 }
 window.PLANCore3D={prepare,feature,polishMethod};
})();
