/* SpatialReasoner-R1: one architecture and a clear three-stage training explanation. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 let openingImage;
 function prepare(main) {
  main.querySelectorAll('p,.content').forEach(p=>{if(!p.querySelector('img,table,svg,p') && p.textContent.includes('We conduct comprehensive evaluation on spatial reasoning tasks to demonstrate the effectiveness of our approach'))p.remove();});
  main.querySelectorAll('[data-studio-section="quantitative"] p').forEach(p=>{if(p.textContent.includes('Spatial reasoning success rates')){p.textContent='SpatialRGPT-Bench evaluates qualitative relations and quantitative measurements. The two tables report each question type separately.';p.classList.add('studio-results-intro');}});
  const method=main.querySelector('[data-studio-section="method"] > .container'),heading=method.querySelector('h2'),image=method.querySelector('img[src$="workflow_c.png"]');image.remove();image.removeAttribute('style');image.alt='SpatialReasoner-R1 architecture and three-stage training pipeline with M3CTS, preference-pair construction, and fine-grained DPO';
  method.replaceChildren(heading,el('p','spatial-method-intro','SpatialReasoner-R1 takes an image, a question, and visual region prompts to generate a grounded description and multi-step spatial reasoning. Its training pipeline first constructs reasoning trajectories, then selects preference pairs, and finally optimizes the descriptive and reasoning segments separately.'));
  const figure=el('figure','spatial-method-figure');figure.append(image,el('figcaption','','M3CTS produces reasoning paths. Spatial rewards select positive and negative responses, and fDPO applies distinct preference updates to descriptive grounding and logical reasoning.'));method.append(figure);
  const steps=el('ol','spatial-training-steps');[['Generate reasoning paths with M3CTS','Multi-Model Monte Carlo Tree Search explores diverse long reasoning trajectories grounded in the scene.'],['Construct fine-grained preference pairs','Candidate responses receive separate descriptive, spatial, and reasoning scores. Reward-based selection produces preferences for the relevant response segments.'],['Optimize descriptions and reasoning with fDPO','Segment-specific preference updates improve visual grounding and logical coherence instead of treating the entire response as one undifferentiated preference.']].forEach(([title,text])=>{const item=el('li');item.append(el('h3','',title),el('p','',text));steps.append(item);});method.append(steps);
  const qualitative=main.querySelector('[data-studio-section="qualitative"] > .container'),qualHeading=qualitative.querySelector('h2'),images=[...qualitative.querySelectorAll('img')];openingImage=images.find(img=>img.src.endsWith('additionexample1.png'));openingImage.remove();
  const grid=el('div','spatial-qualitative-grid');images.filter(img=>img!==openingImage).forEach(image=>{image.removeAttribute('style');image.removeAttribute('width');const figure=el('figure','spatial-qualitative-case');figure.append(image);grid.append(figure);});qualitative.replaceChildren(qualHeading,grid);
 }
 function feature({main,nav}) {
  const source=openingImage,section=el('section','section studio-opening-examples'),box=el('div','container is-max-desktop'),figure=el('figure','studio-example-card'),frame=el('div','studio-example-media');
  source.removeAttribute('style');source.alt='SpatialReasoner-R1 example with visually grounded multi-step spatial reasoning';source.loading='eager';frame.append(source);
  const caption=el('figcaption','studio-opening-caption');caption.append(el('h2','studio-opening-label','Fine-grained preference optimization for spatial reasoning'),el('p','','SpatialReasoner-R1 connects descriptions and reasoning to the objects and relationships visible in the scene.'));figure.append(frame,caption);box.append(figure);section.append(box);main.querySelector('.hero.teaser')?.remove();nav.after(section);
 }
 window.PLANSpatialReasoner={prepare,feature};
})();
