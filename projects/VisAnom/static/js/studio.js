/* Project-specific presentation; the original figures and reported scores stay authoritative. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=document.createElement('link');style.rel='stylesheet';style.href='static/css/studio.css?v=reviewed-project-pages-e418f00-v1';
   style.onload=resolve;style.onerror=()=>reject(new Error('VisAnom presentation styles unavailable'));document.head.append(style);
  });
  // The converted teaser left a detached caption after its overview moved to the opening.
  main.querySelector('.hero.teaser')?.remove();
  main.querySelectorAll('.publication-venue').forEach(node=>node.remove());
  const venue=el('p','publication-venue','NeurIPS 2026');
  main.querySelector('.studio-header .studio-affiliations').after(venue);
  const method=main.querySelector('[data-studio-section="method"] .content');
  const flow=el('ol','visanom-method-flow');flow.setAttribute('aria-label','VisAnomReasoner method');
  [
   ['Input','Time-series plot','The plotted signal retains its shape, axes, and temporal context.'],
   ['Model','Qwen2.5-VL · 3B / 7B','Supervised fine-tuning uses anomaly intervals and grounded reasoning traces from VisAnomBench.'],
   ['Output','Decision, interval, explanation','Structured outputs identify whether an anomaly exists, where it occurs, and the visual evidence.']
  ].forEach(([label,title,description])=>{
   const step=el('li');step.append(el('span','visanom-label',label),el('h3','',title),el('p','',description));flow.append(step);
  });
  method.append(flow);
  const comparison=main.querySelector('[data-result-source="static/images/VisAnomBench_result.png"]');
  main.querySelectorAll('table tbody th[scope="row"]').forEach(cell=>{cell.textContent=cell.textContent.replace(/\s*\[\d+\]/g,'');});
  comparison.querySelectorAll('.studio-ours td').forEach(cell=>{
   const match=cell.textContent.match(/^(.+?)\s+([↑↓]\d+(?:\.\d+)?)$/);
   if(match)cell.replaceChildren(document.createTextNode(match[1]+' '),el('span','studio-metric-gain',match[2]));
  });
  comparison.querySelector('.studio-result-note')?.remove();
  const directions=[null,1,-1,-1,1,1,1,1];
  comparison.querySelectorAll('thead th').forEach((cell,index)=>{if(index)cell.append(document.createTextNode(directions[index]===1?' ↑':' ↓'));});
  const rows=[...comparison.querySelectorAll('tbody tr:not(.studio-group)')];
  directions.forEach((direction,index)=>{
   if(!direction)return;
   const ranked=[...new Set(rows.map(row=>parseFloat(row.cells[index].textContent)))].sort((a,b)=>direction*(b-a));
   rows.forEach(row=>{
    const cell=row.cells[index],value=parseFloat(cell.textContent),first=cell.firstChild;
    if(value!==ranked[0] && value!==ranked[1])return;
    const mark=el(value===ranked[0]?'strong':'u','',first.textContent.trim());first.replaceWith(mark);
   });
  });
  const reasoning=main.querySelector('[data-result-source="static/images/ablation_reasoning.png"]');
  reasoning.querySelector('tbody tr:last-child').classList.add('studio-ours');
  // Keep the score comparison intact: the percentages annotate gains, not bar heights.
  const sizeImage=main.querySelector('img[src$="base_vs_sft_3b_7b.png"]');
  const sizeDescription=sizeImage.previousElementSibling,reasoningDescription=reasoning.previousElementSibling;
  const chart=el('figure','studio-native-result');chart.dataset.resultSource='static/images/base_vs_sft_3b_7b.png';
  chart.append(el('h3','','Consistent gains across model sizes'));
  const frame=el('div','media-card visanom-score-comparison');
  sizeImage.before(chart);sizeImage.removeAttribute('style');
  sizeImage.alt='Base and supervised fine-tuned Qwen2.5-VL scores for 3B and 7B models on a 0–1 axis. Filled gray bars show base scores; blue and orange outlines show SFT scores. Relative gains for 3B and 7B are 180% and 220% in precision, 2% and 11% in recall, 94% and 119% in F1, and 134% and 81% in overlap.';
  frame.append(sizeImage);chart.append(frame);
  sizeDescription.textContent='Both 3B and 7B models improve over their Qwen2.5-VL baselines. Filled gray bars show base scores; blue and orange outlines show VisAnomReasoner scores, with arrows and percentages marking relative improvements.';
  const analysis=el('div','visanom-ablation-stack');chart.before(analysis);
  [[chart,sizeDescription],[reasoning,reasoningDescription]].forEach(([result,description])=>{
   description.classList.add('studio-result-description');
   result.querySelector('h3').after(description);analysis.append(result);
  });
  comparison.previousElementSibling.textContent='Anomaly detection and localization on the held-out VisAnomBench split, comparing vision-language models, language-model anomaly detectors, and conventional detectors.';
  const takeaway=main.querySelector('[data-studio-section="quantitative"] .content > p:last-child');
  const callout=el('aside','visanom-result-takeaway studio-result-callout');callout.setAttribute('aria-label','VisAnomReasoner performance gains on VisAnomBench');
  const gains=el('dl','visanom-result-gains');
  [['+21.23 pp','Precision improvement · at least'],['+23.87 pp','F1 improvement · at least']].forEach(([value,label])=>{
   const item=el('div');item.append(el('dt','',label),el('dd','',value));gains.append(item);
  });
  takeaway.before(callout);callout.append(gains,takeaway);
 }
 function feature({main,nav,zoomable}) {
  const expand=(image,frame)=>{
   zoomable(image,frame);
   const icon=el('i','fa-solid fa-expand');icon.setAttribute('aria-hidden','true');
   frame.querySelector('.studio-zoom').replaceChildren(document.createTextNode('Expand'),icon);
  };
  const section=el('section','studio-feature visanom-feature');section.setAttribute('aria-labelledby','visanom-feature-title');
  const body=el('div','visanom-example');const figure=el('figure','visanom-plot');
  figure.append(el('div','visanom-plot-question','Do you see any anomalies on this plot?'));
  // Display the plot panel from the original teaser, without redrawing or changing its signal.
  // Expand opens the complete, unmodified paper figure, including the answer and comparisons.
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','130 75 970 390');svg.setAttribute('role','img');svg.setAttribute('aria-labelledby','visanom-plot-title');
  const title=document.createElementNS(svg.namespaceURI,'title');title.id='visanom-plot-title';title.textContent='Time-series plot from the paper teaser, showing the anomalous downward deflection.';
  const signal=document.createElementNS(svg.namespaceURI,'image');signal.setAttribute('href','static/images/VisAnomReasoner_teaser.png');signal.setAttribute('width','2370');signal.setAttribute('height','725');svg.append(title,signal);figure.append(svg);
  const original=el('img');original.src='static/images/VisAnomReasoner_teaser.png';original.alt='VisAnomReasoner example and benchmark comparisons from the paper';expand(original,figure);
  const copy=el('div','visanom-example-copy');copy.append(el('div','visanom-label','Time-series anomaly reasoning'));
  const heading=el('h2','','Locate anomalies. Explain the evidence.');heading.id='visanom-feature-title';copy.append(heading);
  copy.append(el('p','','VisAnomReasoner reads a time-series plot and returns an anomaly decision, a localized interval, and reasoning grounded in the visible signal.'));
  const answer=el('dl','visanom-answer');
  [['Anomaly detected','Yes'],['Predicted index interval','16970–17079']].forEach(([label,value])=>{const item=el('div');item.append(el('dt','',label),el('dd','',value));answer.append(item);});copy.append(answer);
  body.append(figure,copy);section.append(body);
  const stats=el('dl','visanom-highlights');
  [['2,576','Training time series'],['3B / 7B','Model variants'],['73.94%','F1 on VisAnomBench · 7B']].forEach(([value,label])=>{const item=el('div');item.append(el('dt','',label),el('dd','',value));stats.append(item);});section.append(stats);
  const takeaway=main.querySelector('.visanom-result-takeaway p').cloneNode(true);takeaway.className='visanom-opening-takeaway';section.append(takeaway);nav.after(section);
  const example=main.querySelector('[data-studio-section="qualitative"] img');
  const frame=el('figure','visanom-qualitative');example.before(frame);frame.append(example);expand(example,frame);
  const toolbar=el('div','visanom-figure-toolbar');toolbar.append(frame.querySelector('.studio-zoom'));frame.append(toolbar);
 }
 window.PLANVisAnom={prepare,feature};
})();
