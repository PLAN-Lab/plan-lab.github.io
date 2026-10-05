/* EC-VLM's opt-in presentation preserves the original figures and reported scores. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 let overviewImage;
 function rank(cells) {
  const values=cells.map(cell=>parseFloat(cell.textContent));
  const ordered=[...new Set(values.filter(Number.isFinite))].sort((a,b)=>b-a);
  cells.forEach((cell,index)=>{
   const place=values[index]===ordered[0]?'best':values[index]===ordered[1]?'second':null;
   if(!place)return;
   const mark=el(place==='best'?'strong':'u',`ecvlm-${place}`);mark.append(...cell.childNodes);cell.append(mark);
  });
 }
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=el('link');style.rel='stylesheet';style.href='static/css/studio.css?v=project-pages-inline-data-v2';
   style.onload=resolve;style.onerror=()=>reject(new Error('EC-VLM presentation styles unavailable'));document.head.append(style);
  });
  const header=main.querySelector('.studio-header'),oldVenue=header.querySelector('.publication-venue'),venueWrapper=oldVenue.parentElement;
  oldVenue.remove();if(!venueWrapper.childElementCount && !venueWrapper.textContent.trim())venueWrapper.remove();
  header.querySelector('.studio-affiliations').after(el('p','publication-venue','TMLR 2025'));
  const links=header.querySelector('.publication-links');if(links.parentElement.classList.contains('column'))links.parentElement.replaceWith(links);

  const abstract=main.querySelector('[data-studio-section="abstract"]');
  abstract.querySelectorAll('.content p').forEach(p=>{
   const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let node;
   while((node=walker.nextNode()))node.textContent=node.textContent.replace(/\\%/g,'%');
  });
  const posterFrame=abstract.querySelector('iframe[data-pdf-src]'),posterSource=posterFrame.dataset.pdfSrc;
  posterFrame.closest('.columns').remove();
  const poster=el('section','section');poster.id='studio-poster';poster.dataset.studioSection='poster';poster.setAttribute('aria-labelledby','ecvlm-poster-title');
  const posterBox=el('div','container is-max-desktop'),posterTitle=el('h2','title is-3','Poster');posterTitle.id='ecvlm-poster-title';
  const posterFigure=el('figure','ecvlm-figure ecvlm-poster-figure'),posterImage=el('img');posterImage.src='static/images/ecvlm-poster-preview.jpg';posterImage.alt='EC-VLM research poster: emergent-communication pretraining, experiments, and qualitative token analysis.';posterImage.loading='lazy';posterImage.width=1800;posterImage.height=1343;posterFigure.append(posterImage);
  const posterLink=el('a','button is-rounded ecvlm-poster-link','Open poster PDF');posterLink.href=posterSource;posterLink.target='_blank';posterLink.rel='noopener';
  posterBox.append(posterTitle,posterFigure,posterLink);poster.append(posterBox);main.querySelector('[data-studio-section="bibtex"]').before(poster);

  const method=main.querySelector('[data-studio-section="method"]'),box=method.querySelector(':scope > .container'),title=box.querySelector('h2');
  overviewImage=method.querySelector('img');const description=el('p');description.append(...overviewImage.nextElementSibling.childNodes);overviewImage.remove();
  overviewImage.removeAttribute('style');overviewImage.alt='A speaker generates image-grounded EC messages; a listener identifies the target image. These messages pretrain a VLM for downstream vision-language tasks.';overviewImage.loading='eager';overviewImage.width=2094;overviewImage.height=962;
  const copy=el('div','content'),flow=el('ol','ecvlm-method-flow');flow.setAttribute('aria-label','EC-VLM pretraining and transfer stages');
  [
   ['Referential game','The speaker describes a target image through EC tokens. The listener uses the message to choose that image among distractors.'],
   ['EC pretraining','Image–message pairs provide visually grounded supervision for a vision-language model, without human-written pretraining captions.'],
   ['Downstream transfer','The pretrained model is fine-tuned for natural-language tasks, including entailment, referring expressions, captioning, and visual question answering.']
  ].forEach(([label,text])=>{const step=el('li');step.append(el('h3','',label),el('p','',text));flow.append(step);});
  copy.append(description,flow);box.replaceChildren(title,copy);

  const results=main.querySelector('[data-studio-section="quantitative"]'),resultBox=results.querySelector(':scope > .container'),resultTitle=resultBox.querySelector('h2');
  const figures=[...results.querySelectorAll('.studio-native-result')];resultBox.replaceChildren(resultTitle,...figures);
  const captions=[
   ['EC pretraining improves both validation and test accuracy at every training size. With the full training set, EC pretraining reaches 85.3% validation accuracy and 85.01% test accuracy, versus 50.3% and 49.94% for the baseline. The gap to natural-language pretraining narrows as the training set grows.'],
   ['LLaVA-1.5-EC uses 558K images for EC pretraining and 665K fine-tuning examples. Relative to BLIP-2 (13B), the reported gains are 104.23% on VizWiz, 34.8% on GQA, and 10.8% on VQAv2.',
    'LLaVA-1.5-EC exceeds InstructBLIP (13B) on GQA, VizWiz, and SciQA-IMG, and Qwen-VL on VizWiz (40.03 vs. 35.2), despite Qwen-VL’s much larger pretraining corpus. InstructBLIP retains a higher TextVQA score. Standard LLaVA-1.5 remains stronger on these five instruction-following tasks.'],
   ['LLaVA-1.5-EC leads the listed models with 67.3% on MMBench English and 64.01% on MMBench Chinese. Compared with standard LLaVA-1.5, these are gains of 3.0 and 5.71 percentage points, respectively. Orange bars mark LLaVA-1.5-EC.']
  ];
  figures.forEach((figure,index)=>{
   const lead=figure.querySelector('h3'),text=el('div','ecvlm-result-explanation');captions[index].forEach(sentence=>text.append(el('p','',sentence)));lead.after(text);
  });
  const table=figures[1].querySelector('table'),rows=[...table.tBodies[0].rows];
  rows.find(row=>row.cells[0].textContent==='LLaVA-1.5-EC').classList.add('studio-ours');
  for(let column=5;column<10;column++)rank(rows.map(row=>row.cells[column]));
  const ranking=el('p','ecvlm-ranking-caption','Best scores are ');ranking.append(el('strong','','bold'),document.createTextNode('; second-best scores are '),el('u','','underlined'),document.createTextNode('.'));
  figures[1].querySelector('.ecvlm-result-explanation').append(ranking);
  figures[2].querySelectorAll('.studio-bar').forEach(bar=>{if(bar.querySelector('title').textContent.startsWith('LLaVA-1.5-EC-7B ·'))bar.classList.add('ecvlm-ours-bar');});
  figures[2].querySelectorAll('svg text').forEach(label=>{if(label.textContent==='LLaVA-1.5-EC-7B')label.classList.add('ecvlm-ours-label');});

  const descriptions=['EC token patterns associated with broccoli and food-related image groups.','EC token patterns associated with zebra images across different sequence positions.','EC token patterns associated with vehicles and animals, illustrating positional and structural roles.'];
  main.querySelectorAll('[data-studio-section="qualitative"] .qual-example').forEach((figure,index)=>{
   figure.removeAttribute('style');figure.classList.add('ecvlm-example');const image=figure.querySelector('img');image.removeAttribute('style');image.alt=descriptions[index];figure.querySelector('figcaption').removeAttribute('style');
  });
 }
 function feature({main,nav,zoomable}) {
  const section=el('section','studio-feature ecvlm-feature');section.setAttribute('aria-labelledby','ecvlm-feature-title');
  const title=el('h2','','Emergent communication for vision-language pretraining');title.id='ecvlm-feature-title';
  section.append(el('div','ecvlm-label','AGENT-GENERATED SUPERVISION'),title,el('p','ecvlm-feature-intro','EC-VLM uses image-grounded messages from a speaker–listener game to pretrain a vision-language model, then transfers the learned visual representations to natural-language tasks.'));
  const figure=el('figure','ecvlm-figure');figure.append(overviewImage,el('figcaption','','Speaker–listener messages provide visual grounding for downstream vision-language tasks.'));section.append(figure);nav.after(section);
  [figure,...main.querySelectorAll('.ecvlm-example,.ecvlm-poster-figure')].forEach(frame=>{
   const toolbar=el('div','ecvlm-figure-toolbar');frame.append(toolbar);zoomable(frame.querySelector('img'),toolbar);
   const control=toolbar.querySelector('button');control.replaceChildren(document.createTextNode('Expand '),el('i','fa-solid fa-expand'));
  });
 }
 window.PLANECVLM={prepare,feature};
})();
