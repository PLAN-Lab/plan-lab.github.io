/* VTAM: one architecture diagram and success-rate plots from the source table. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const sv=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([key,value])=>n.setAttribute(key,value));if(text!=null)n.textContent=text;return n;};
 function playbackControls(container) {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,frames=[...container.querySelectorAll('iframe')];
  const toolbar=el('div','vtam-playback-bar'),toggle=el('button','studio-control',reduced?'Play all':'Pause all'),label=el('label'),rate=el('select'),status=el('span','vtam-playback-status');
  toggle.type='button';toggle.disabled=true;rate.id='vtam-playback-rate';rate.disabled=true;label.htmlFor=rate.id;label.append(el('span','','Playback speed'));
  [.5,1,1.5,2].forEach(value=>{const option=el('option','',`${value}×`);option.value=value;option.selected=value===2;rate.append(option);});label.append(rate);status.setAttribute('role','status');toolbar.append(toggle,label,status);container.querySelector('h2').after(toolbar);
  frames.forEach(frame=>{const url=new URL(frame.src);url.searchParams.set('muted','true');url.searchParams.set('loop','true');if(!reduced)url.searchParams.set('autoplay','true');frame.src=url.href;frame.title=frame.closest('.vtam-video-card').querySelector('.vtam-video-title').textContent.trim();});
  function connect() {
   const players=frames.map(frame=>window.Stream(frame));let paused=reduced;
   const apply=player=>{player.muted=true;player.loop=true;player.playbackRate=Number(rate.value);if(paused)player.pause();else Promise.resolve(player.play()).catch(()=>{});};
   players.forEach(player=>{apply(player);player.addEventListener('loadedmetadata',()=>apply(player));});
   rate.addEventListener('change',()=>{players.forEach(player=>{player.playbackRate=Number(rate.value);});});
   toggle.addEventListener('click',()=>{paused=!paused;players.forEach(apply);toggle.textContent=paused?'Play all':'Pause all';});
   toggle.disabled=false;rate.disabled=false;
  }
  if(typeof window.Stream==='function')connect();
  else {const script=el('script');script.src='https://embed.cloudflarestream.com/embed/sdk.latest.js';script.async=true;script.onload=()=>{if(typeof window.Stream==='function')connect();};script.onerror=()=>{status.textContent='Use each video’s playback controls.';};document.head.append(script);}
 }
 function prepare(main) {
  const method=main.querySelector('[data-studio-section="method"] > .container');
  const heading=method.querySelector('h2'),image=method.querySelector('img[src$="method_arch.png"]');
  image.remove();image.removeAttribute('style');image.removeAttribute('class');
  image.alt='VTAM architecture: first-person, third-person, and GelSight tactile inputs condition a joint action, state, and force diffusion model';
  method.replaceChildren(heading,el('p','vtam-method-intro','VTAM adds tactile perception to a pretrained video model and uses the resulting interaction representation to predict actions. Two RGB views and a GelSight stream capture the scene and contact state; the control model conditions on these features together with past robot actions and states.'));
  const figure=el('figure','vtam-architecture');figure.append(image);method.append(figure);
  const stages=el('ol','vtam-training-stages');
  [['Stage I · Learn visuo-tactile dynamics','Multi-view diffusion learns joint predictive dynamics from first-person video, third-person video, and tactile observations in latent space. Modality transfer fine-tuning adds touch without requiring tactile–language paired data or independent tactile pretraining.'],['Stage II · Learn contact-aware control','Conditional diffusion jointly predicts future actions, states, and a deformation-derived virtual force proxy. Tactile regularization balances cross-modal attention, preserving sensitivity to contact while preventing visual latents from dominating the optimization.']].forEach(([title,text])=>{
   const item=el('li');item.append(el('h3','',title),el('p','',text));stages.append(item);
  });method.append(stages);main.querySelector('.hero.teaser')?.remove();

  const table=main.querySelector('[data-studio-section="quantitative"] table');
  const rows=[...table.tBodies].flatMap(body=>[...body.rows]).map(row=>({name:row.cells[0].textContent.trim(),values:[...row.cells].slice(1).map(cell=>Number(cell.textContent.replace('%','')))}));
  const card=el('figure','studio-native-result vtam-success-results');card.append(el('h3','','Contact-rich manipulation'));
  card.append(el('p','studio-result-description','Task success rates for chip pick-and-place, cucumber peeling, and whiteboard wiping. VTAM reaches 90%, 85%, and 95%, respectively. Each model is evaluated over 80 trials.'));
  const grid=el('div','vtam-success-grid'),colors=['#597d9f','#83afd9','#b2c9e1','#ff915b'];
  ['Chip pick-and-place','Cucumber peeling','Whiteboard wiping'].forEach((task,index)=>{
   const panel=el('div','vtam-success-panel');panel.append(el('h4','',task));
   const svg=sv('svg',{viewBox:'0 0 400 305',role:'img','aria-label':`${task}: success rate from 0 to 100 percent`});
   for(let tick=0;tick<=4;tick++){
    const x=16+tick*92;svg.append(sv('line',{x1:x,x2:x,y1:38,y2:269,class:'studio-grid'}),sv('text',{x,y:295,'text-anchor':tick===0?'start':tick===4?'end':'middle',class:'vtam-axis-tick'},`${tick*25}%`));
   }
   rows.forEach((row,rowIndex)=>{
    const y=27+rowIndex*64,value=row.values[index];
    svg.append(sv('text',{x:16,y,class:'vtam-model-label'},row.name),sv('text',{x:384,y,'text-anchor':'end',class:'vtam-value-label'},`${value}%`));
    const bar=sv('rect',{x:16,y:y+11,width:368*value/100,height:18,rx:3,fill:colors[rowIndex],class:'studio-bar','data-value':value});
    bar.append(sv('title',{},`${task} · ${row.name}: ${value}%`));svg.append(bar);
   });panel.append(svg);grid.append(panel);
  });card.append(grid);
  const details=el('details','vtam-full-scores'),summary=el('summary','','All success rates'),scroll=el('div','studio-table-scroll');scroll.append(table);details.append(summary,scroll);card.append(details);
  const resultContainer=main.querySelector('[data-studio-section="quantitative"] > .container');
  const resultHeading=resultContainer.querySelector('h2');resultContainer.replaceChildren(resultHeading,card);

  const qualitative=main.querySelector('[data-studio-section="qualitative"] > .container');
  const qualitativeHeading=qualitative.querySelector('h2'),groups=el('div','vtam-task-groups');
  const taskGrids=[...qualitative.querySelectorAll('.vtam-video-grid')].filter(grid=>!grid.closest('.vtam-two-split'));
  taskGrids.forEach(grid=>{
   const taskHeading=grid.previousElementSibling;
   grid.style.setProperty('--vtam-video-columns',grid.children.length);
   const group=el('article','vtam-task-group');group.append(el('h3','',taskHeading.textContent.trim()),grid);groups.append(group);
  });
  const cases=qualitative.querySelector('.vtam-two-split');
  const caseGroups=el('div','vtam-case-groups');
  [...cases.children].forEach(source=>{
   if(source.querySelector('h4').textContent.includes('Success Cases for Baseline Models'))return;
   const group=el('article','vtam-task-group');group.append(el('h3','',source.querySelector('h4').textContent.trim()),source.querySelector('.vtam-video-grid'));caseGroups.append(group);
  });
  qualitative.replaceChildren(qualitativeHeading,groups,caseGroups);
  playbackControls(qualitative);
 }
 window.PLANVTAM={prepare};
})();
