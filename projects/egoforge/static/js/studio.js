/* EgoForge presentation uses the supplied rollout videos and original method figure. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 const examples=[
  ['pour','png','Pouring a drink','Pour the Pepsi into the cup and put the can back.'],
  ['basketball_1','jpg','Basketball shots','Take two shots at the basketball hoop.'],
  ['household_1','jpg','Packing a bag','Put the pack into the bag and place the bag on the bed.']
 ];
 function prepare(main) {
  const content=main.querySelector('[data-studio-section="method"] .content'),image=content.querySelector('img');
  image.remove();image.removeAttribute('style');
  image.alt='EgoForge architecture: static visual inputs and a goal instruction condition the video diffusion model, with VGGT geometry alignment and trajectory-level reward training.';
  content.replaceChildren(el('p','egoforge-method-intro','EgoForge turns a single first-person image and a goal instruction into a video rollout. An optional external view adds scene context, while geometry alignment and GRAFT trajectory rewards strengthen spatial consistency and goal alignment.'));
  const steps=el('ol','studio-explainer-grid egoforge-method-steps');steps.setAttribute('aria-label','EgoForge method components');
  [
   ['Condition the generator','fa-image','The egocentric image, instruction, and optional external reference condition the diffusion transformer through adaptive normalization and cross-attention. A pretrained video autoencoder maps between video frames and latent representations.'],
   ['Align the geometry','fa-cubes','Geometry features from a pretrained VGGT encoder guide intermediate diffusion features. Angular alignment matches feature direction, while scale alignment matches feature magnitude and prevents scale collapse.'],
   ['Refine whole trajectories','fa-route','GRAFT uses negative-aware fine-tuning with rewards evaluated over complete video trajectories, aligning the rollout with the requested goal and its visual context.']
  ].forEach(([title,iconClass,description])=>{
   const step=el('li','studio-explainer-card'),icon=el('i',`fa-solid ${iconClass}`);icon.setAttribute('aria-hidden','true');step.append(icon,el('h3','',title),el('p','',description));steps.append(step);
  });content.append(steps);
  const figure=el('figure','egoforge-method-figure');figure.append(image,el('figcaption','','Static visual context and the goal instruction guide generation, while geometry supervision and GRAFT rewards align the rollout with the scene and intended outcome.'));content.append(figure);
  content.append(el('h3','egoforge-reward-title','GRAFT trajectory rewards'));
  const rewards=el('dl','egoforge-rewards');
  [
   ['Goal completion','Does the final state achieve the requested outcome?'],
   ['Scene consistency','Does the rollout preserve the initial environment and object layout?'],
   ['Temporal causality','Do actions and motion evolve in a coherent, physically plausible sequence?'],
   ['Perceptual fidelity','Are the frames clear and stable? PSNR, FVD, and LPIPS measure visual quality.']
  ].forEach(([title,description])=>{const item=el('div');item.append(el('dt','',title),el('dd','',description));rewards.append(item);});content.append(rewards);
 }
 function feature({main,nav,zoomable}) {
  main.querySelector('.hero.teaser').remove();
  const section=el('section','section studio-opening-examples egoforge-video-examples');section.setAttribute('aria-labelledby','egoforge-examples-title');
  const box=el('div','container is-max-desktop'),grid=el('div','egoforge-video-grid');
  examples.forEach(([id,extension,title,instruction])=>{
   const path=`static/videos/examples/${id}/`,card=el('article','egoforge-video-case');card.dataset.example=id;
   const video=el('video');video.src=path+'generated.mp4';video.poster=path+'first_frame.'+extension;video.autoplay=true;video.muted=true;video.loop=true;video.playsInline=true;video.controls=true;video.preload='metadata';video.setAttribute('aria-label',`EgoForge generated video: ${instruction}`);
   const frame=el('div','egoforge-output');frame.append(video);
   const copy=el('div','egoforge-case-copy');copy.append(el('h3','',title),el('p','egoforge-instruction',instruction));
   const inputs=el('div','egoforge-inputs');
   [['first_frame','Egocentric input'],['exo','External reference']].forEach(([filename,label])=>{
    const figure=el('figure'),image=el('img');image.src=path+filename+'.'+extension;image.alt=`${label} for the ${title.toLowerCase()} example`;image.loading='lazy';figure.append(image,el('figcaption','',label));inputs.append(figure);
   });copy.append(inputs);card.append(frame,copy);grid.append(card);
  });
  const caption=el('div','studio-opening-caption'),heading=el('h2','studio-opening-label','Goal-directed first-person rollouts');heading.id='egoforge-examples-title';
  caption.append(heading,el('p','','An egocentric image, a goal instruction, and an external reference guide each generated first-person rollout.'));box.append(grid,caption);section.append(box);nav.after(section);
  const methodFigure=main.querySelector('.egoforge-method-figure');zoomable(methodFigure.querySelector('img'),methodFigure);
 }
 window.PLANEgoForge={prepare,feature};
})();
