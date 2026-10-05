/* MMPlanner: full-size diagrams and explicit visual ordering results. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function prepare(main) {
  const method=main.querySelector('[data-studio-section="method"] > .container');
  method.querySelector('img').alt='MMPlanner architecture: textual plan, image descriptions with object state reasoning, and visual plan generation';
  const evaluation=el('div','studio-subsection mmplanner-evaluation');evaluation.append(el('h3','','How multimodal plans are evaluated'));
  const grid=el('div','studio-explainer-grid');
  [['T-PlanScore','Assesses textual planning accuracy and temporal coherence.'],['CA-Score','Assesses agreement between each textual instruction and its visual depiction.'],['VS-Ordering','Tests whether visual steps carry enough information to recover their correct procedural order. Accuracy, longest common subsequence, rank correlation, and distance measures compare the recovered sequence with the reference.']].forEach(([title,text])=>{const card=el('article','studio-explainer-card');card.append(el('h4','',title),el('p','',text));grid.append(card);});evaluation.append(grid);method.append(evaluation);
  const result=main.querySelector('[data-result-source="static/images/mmplanner_vs_ordering.png"]');result.querySelector('h3').textContent='Visual Step Ordering (VS-Ordering)';
 }
 function feature({main,nav}) {
  const teaser=main.querySelector('.hero.teaser'),image=teaser.querySelector('img');
  const section=el('section','section studio-opening-examples'),box=el('div','container is-max-desktop'),figure=el('figure','studio-example-card'),frame=el('div','studio-example-media');
  image.removeAttribute('style');image.alt='MMPlanner generated multimodal plan and its evaluation tasks';image.loading='eager';frame.append(image);
  const caption=el('figcaption','studio-opening-caption');caption.append(el('h2','studio-opening-label','Plans with aligned text and images'),el('p','','MMPlanner tracks how objects change across steps, keeping the textual plan and generated images aligned.'));figure.append(frame,caption);box.append(figure);section.append(box);teaser.remove();nav.after(section);
 }
 window.PLANMMPlanner={prepare,feature};
})();
