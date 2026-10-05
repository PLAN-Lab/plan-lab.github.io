/* HalluSegBench: original model diagram, paired data, and hallucination metrics. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function windowFigure(viewBox,label,caption,cls) {
  const figure=el('figure','hallu-source-figure '+cls),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',viewBox);svg.setAttribute('role','img');svg.setAttribute('aria-label',label);
  const image=document.createElementNS(svg.namespaceURI,'image');image.setAttribute('href','static/images/halluseg_poster.png');image.setAttribute('width','6048');image.setAttribute('height','3024');svg.append(image);
  figure.append(svg,el('figcaption','',caption));return figure;
 }
 function prepare(main) {
  const method=main.querySelector('[data-studio-section="method"] > .container'),heading=method.querySelector('h2');
  method.replaceChildren(heading,el('p','hallu-method-intro','RobustSeg learns when a requested object has visual support. Counterfactual fine-tuning uses both present-object examples, which require a mask, and absent-object examples, which require abstention. Frozen vision and language encoders feed a trainable segmentation decoder and language adapters.'));
  const modelFigure=el('figure','hallu-model-figure'),modelImage=el('img');modelImage.src='static/images/architecture.png';modelImage.alt='RobustSeg architecture and counterfactual fine-tuning pipeline';modelFigure.append(modelImage,el('figcaption','','The SAM image encoder and VLM encoder remain frozen. LoRA adapters and the SAM decoder learn from positive segmentation pairs and negative pairs formed by changing either the query or the image.'));method.append(modelFigure);
  const dataset=main.querySelector('[data-studio-section="dataset"] > .container'),datasetHeading=dataset.querySelector('h2');
  dataset.replaceChildren(datasetHeading,el('p','hallu-dataset-intro','HalluSegBench tests referring expressions and reasoning questions on paired factual and counterfactual images. Controlled object replacements preserve the scene context while changing whether the queried object is present, exposing masks generated from contextual expectations instead of visual evidence.'));
  const stats=el('dl','studio-package-stats hallu-stats');
  [['3,673','Paired examples'],['2,958','Images'],['7,346','Segmentation masks'],['816','Object categories']].forEach(([value,label])=>{const item=el('div');item.append(el('dt','',value),el('dd','',label));stats.append(item);});dataset.append(stats);
  const tasks=el('div','hallu-dataset-layout'),copy=el('div','hallu-pair-explanation');
  copy.append(el('h3','','One pair tests four decisions'),el('p','','Changing the image or the expression independently tests whether the mask follows the evidence. Both matching pairs require segmentation. Each mismatched pair requires abstention.'));
  const table=el('table','hallu-pair-table');table.innerHTML='<thead><tr><th scope="col">Image</th><th scope="col">Query</th><th scope="col">Expected response</th></tr></thead><tbody><tr><th scope="row">Factual</th><td>Original object</td><td>Segment</td></tr><tr><th scope="row">Factual</th><td>Replacement object</td><td>Abstain</td></tr><tr><th scope="row">Counterfactual</th><td>Original object</td><td>Abstain</td></tr><tr><th scope="row">Counterfactual</th><td>Replacement object</td><td>Segment</td></tr></tbody>';copy.append(table);
  tasks.append(copy,windowFigure('1710 420 2440 820','Counterfactual Segmentation Reasoning examples','Paired scenes expose hallucination when a query names an object that was replaced. The examples illustrate baseline failures on the Counterfactual Segmentation Reasoning task.','hallu-task-figure'));dataset.append(tasks);
  const split=el('p','hallu-split-description','The benchmark includes 2,812 referring-expression pairs and 861 reasoning pairs. The training split contains 1,934 pairs and the test split contains 1,739.');dataset.append(split);
  const links=el('div','studio-package-links');[['Explore the dataset','https://huggingface.co/datasets/PLAN-Lab/HalluSegBench'],['Read the paper','https://arxiv.org/abs/2506.21546']].forEach(([label,url])=>{const a=el('a','',label);a.href=url;links.append(a);});dataset.append(links);
  const metrics=el('div','hallu-metrics');metrics.append(el('h3','','Measuring hallucination and grounding'),el('p','','Factual IoU measures mask quality when the object is present. The new metrics test whether the model changes its prediction when the evidence changes and how severe an unsupported mask is.'));
  const grid=el('div','studio-explainer-grid');
  [['Textual ΔIoU ↑','Change the query, keep the image','The gap between factual IoU and mask overlap under a query-only change measures whether the model distinguishes a present object from an absent one named in the same scene.'],['Visual ΔIoU ↑','Change the image, keep the query','The corresponding gap after replacing the queried object measures whether the mask responds to visual evidence rather than following the unchanged language prompt.'],['Confusion Mask Score ↓','Measure an unsupported mask','CMS penalizes overlap with the replacement object and leakage into other regions, normalized by the reference object area. Lower scores mean less hallucination. Abstaining on an absent object gives zero.']].forEach(([title,subtitle,description])=>{const card=el('article','studio-explainer-card');card.append(el('h4','',title),el('strong','hallu-metric-subtitle',subtitle),el('p','',description));grid.append(card);});metrics.append(grid);dataset.append(metrics);
 }
 function feature({main,nav}) {
  const teaser=main.querySelector('.hero.teaser'),image=main.querySelector('img[src$="teaser_new.jpg"]');image.alt='HalluSegBench paired examples, object distribution, and RobustSeg evaluation';image.removeAttribute('style');image.loading='eager';
  const section=el('section','section studio-opening-examples hallu-opening'),box=el('div','container is-max-desktop'),figure=el('figure','studio-example-card'),frame=el('div','studio-example-media');
  frame.append(image);const caption=el('figcaption','studio-opening-caption');caption.append(el('h2','studio-opening-label','Segmentation grounded in visual evidence'),el('p','','Paired factual and counterfactual examples test segmentation and abstention. The benchmark spans diverse objects and compares RobustSeg with existing segmentation models.'));figure.append(frame,caption);box.append(figure);section.append(box);teaser?.remove();nav.after(section);
 }
 window.PLANHalluSeg={prepare,feature};
})();
