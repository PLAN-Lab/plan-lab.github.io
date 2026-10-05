/* CogniRoute presentation: original research media and reported results. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 let openingImage;
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=el('link');style.rel='stylesheet';style.href='static/css/studio.css?v=project-pages-inline-data-v2';
   style.onload=resolve;style.onerror=()=>reject(new Error('CogniRoute presentation styles unavailable'));document.head.append(style);
  });
  const teaser=main.querySelector('.hero.teaser');
  openingImage=teaser.querySelector('img');openingImage.remove();teaser.remove();
  openingImage.alt='CogniRoute on VR smart glasses: interpreting a gesture-guided request and a hesitant, polite refusal.';
  openingImage.loading='eager';


  const method=main.querySelector('[data-studio-section="method"] .content');
  const architecture=method.querySelector('img[src$="method.jpg"]');architecture.remove();
  architecture.alt='CogniRoute architecture: schema-aligned supervised routing followed by joint reinforcement learning of answers and expert selection.';
  method.replaceChildren(el('p','','A social question may depend on a gesture, a tone of voice, or an earlier turn in a conversation. CogniRoute trains the model’s router to reflect this evidence structure, so that expert selection supports the reasoning the question requires. Its cognitive schema describes each training example along three complementary axes.'));
  method.append(el('h3','','What the schema captures'));
  const schema=el('ul','cogniroute-schema studio-explainer-grid');
  [
   ['Evidence source','fa-layer-group','Identifies whether an answer needs visual cues, audio cues, both together, or conflicting signals, such as reassuring words paired with a hesitant expression.',['Visual','Audio','Joint','Conflict']],
   ['Reasoning demand','fa-brain','Specifies whether the model must observe a cue, track changes, infer causes or mental states, or interpret social conventions and sarcasm.',['Direct Perception','Temporal','Causal','Mental State','Social Norm','Sarcasm']],
   ['Temporal scope','fa-clock','Identifies the relevant span of a video, from a single moment to several separated segments, including earlier turns in a conversation.',['Momentary','Local Window','Long Range','Multi Segment']]
  ].forEach(([name,iconClass,description,labels])=>{
   const card=el('li','studio-explainer-card'),icon=el('i',`fa-solid ${iconClass}`);
   icon.setAttribute('aria-hidden','true');
   const categories=el('ul','cogniroute-schema-labels');categories.setAttribute('aria-label',`${name} categories`);
   labels.forEach(label=>categories.append(el('li','',label)));
   card.append(icon,el('h4','',name),el('p','',description),categories);schema.append(card);
  });method.append(schema);
  const figure=el('figure','cogniroute-figure');figure.append(architecture,el('figcaption','','The schema guides expert routing during supervised training. Reinforcement learning then refines both the generated answer and the choice of experts.'));method.append(figure);
  method.append(el('h3','','Schema-Aligned Predictive Routing (SAPR)'),el('p','','During supervised fine-tuning, CogniRoute summarizes modality-specific routing patterns across the MoE layers into a global routing signature. Alongside learning to answer the question, it learns to align this signature with the example’s schema. This encourages expert allocation to reflect the required evidence source, reasoning demand, and temporal scope.'));
  const trainingOnly=el('p','cogniroute-training-note');trainingOnly.append(el('strong','','The schema is used only during training. '),document.createTextNode('At inference time, the model receives the video, audio, and question; no schema labels are required.'));method.append(trainingOnly);
  const rmrl=el('p','cogniroute-rmrl','RMRL jointly refines answers and expert routing using rewards for answer correctness, modality-consistent reasoning, and temporal grounding. The feedback trains both generated tokens and expert choices to produce answers supported by the ');
  rmrl.append(el('span','cogniroute-keep-together','relevant evidence.'));
  method.append(el('h3','','Route-Aware MoE Reinforcement Learning (RMRL)'),rmrl);

  const dataset=main.querySelector('[data-studio-section="dataset"] .content');
  const datasetImage=dataset.querySelector('img');datasetImage.remove();
  datasetImage.alt='OmniSocialBench annotation pipeline: extracting social evidence, assigning cognitive schema labels, generating grounded reasoning, and manually verifying evaluation examples.';
  dataset.replaceChildren(el('p','','OmniSocialBench pairs social video questions with evidence-grounded reasoning, cognitive schema labels, and temporal evidence spans.'));
  const facts=el('div','cogniroute-dataset-facts');
  [['118K','Structured training examples'],['Manually verified','Evaluation split']].forEach(([value,label])=>{
   const fact=el('div','cogniroute-dataset-fact');fact.append(el('strong','',value),el('span','',label));facts.append(fact);
  });dataset.append(facts);
  const datasetFigure=el('figure','cogniroute-figure cogniroute-dataset-figure');
  datasetFigure.append(datasetImage,el('figcaption','','The pipeline extracts social cues, assigns schema labels, generates grounded reasoning, and manually verifies evaluation examples.'));dataset.append(datasetFigure);
  const dimensions=el('ul','studio-explainer-grid cogniroute-dataset-dimensions');dimensions.setAttribute('aria-label','Social inference dimensions');
  [
   ['Mental state','Emotions, beliefs, and intent.'],
   ['Pragmatic meaning','Indirect speech, implicature, and sarcasm.'],
   ['Action goal','The purpose behind an observed action.'],
   ['Social norm','Conventions, expectations, and social rules.']
  ].forEach(([name,description])=>{
   const card=el('li','studio-explainer-card');card.append(el('h4','',name),el('p','',description));dimensions.append(card);
  });dataset.append(dimensions);
  const annotation=el('details','cogniroute-dataset-details');annotation.append(el('summary','','Annotation and verification details'));
  annotation.append(el('p','','Training examples come from social and egocentric video corpora, including SocialIQ, SocialMM, LLaVA-Video, NeXT-QA, VideoChatGPT, MTM, and Charades. Extracted cues include participants, scene context, gaze, expression, body pose, gestures, object interactions, speech, speaker changes, laughter, silence, and acoustic events.'));
  annotation.append(el('p','','Every evaluation example is manually checked for answer validity, evidence consistency, schema correctness, reasoning support, temporal grounding, and social-dimension assignment.'));dataset.append(annotation);

  // Remove paper-style numbering from visible captions and accessible image names.
  main.querySelectorAll('p > strong:first-child').forEach(label=>{
   if(/^(Figure|Table)\s+\d+\s*[:.]?$/.test(label.textContent.trim()))label.remove();
  });
  main.querySelectorAll('img[alt]').forEach(image=>{image.alt=image.alt.replace(/^Figure\s+\d+\s*[:.]\s*/i,'');});

  main.querySelectorAll('table.results-table').forEach((table,index)=>{
   table.querySelectorAll('.highlight-row').forEach(row=>row.classList.add('studio-ours'));
   const caption=el('caption','studio-sr-only',index===0?'OmniSocialBench social understanding accuracy':'Generalization to public audio-visual benchmarks, group '+index);table.prepend(caption);
   table.querySelectorAll('thead th').forEach(cell=>{cell.scope='col';});
  });
  const quantitative=main.querySelector('[data-studio-section="quantitative"]');
  quantitative.querySelectorAll('br').forEach(node=>node.remove());
  const chart=quantitative.querySelector('[data-result-source="static/images/ablation.jpg"]');
  const originalCaption=chart.previousElementSibling;originalCaption.remove();
  const ablations=el('section','section');ablations.id='studio-ablations';ablations.dataset.studioSection='ablations';ablations.setAttribute('aria-labelledby','cogniroute-ablations-title');
  const container=el('div','container is-max-desktop'),heading=el('h2','title is-3','Ablations');heading.id='cogniroute-ablations-title';container.append(heading);
  const copy=el('div','content');
  const takeaway=el('div','cogniroute-ablation-takeaway');takeaway.append(el('h3','','Correct evidence structure and joint optimization both matter.'),el('p','','SAPR raises average accuracy from 40.13% to 50.13%; random or shuffled schema variants provide much smaller gains. Starting from that checkpoint, full RMRL raises accuracy to 59.38%, outperforming token-only or gate-only optimization. The best results come from giving training feedback to both the generated answer and the router’s expert choices.'));
  copy.append(takeaway,chart);
  chart.querySelector('.studio-result-note').textContent='Select SAPR or RMRL to compare the reported configurations. Full denotes the complete objective in each stage; the RMRL comparison starts from the SAPR-trained checkpoint. Chart values are rounded to one decimal place.';
  const highlightFull=()=>{
   chart.querySelectorAll('.studio-bar').forEach(bar=>{if(bar.querySelector('title').textContent.startsWith('Full '))bar.classList.add('cogniroute-full');});
  };highlightFull();chart.querySelector('select').addEventListener('change',highlightFull);
  container.append(copy);ablations.append(container);quantitative.after(ablations);
  const explanations=el('dl','cogniroute-ablation-key');
  [
   ['SAPR configurations','Random and shuffled tags break the link between an example and its evidence structure. A shared projection uses the same mapping across MoE layers. Full SAPR uses the correct tags and separate projections for each layer.'],
   ['RMRL configurations','All variants start from the same SAPR-trained checkpoint and use the same reward. Token + trainable router allows router updates without an explicit gate objective; Full RMRL assigns learning feedback to both generated tokens and expert choices.']
  ].forEach(([name,description])=>{explanations.append(el('dt','',name),el('dd','',description));});copy.append(explanations);
  // Enable inspection of the same full-resolution scientific figures.
  main.querySelectorAll('[data-studio-section="dataset"] img.interpolation-image,[data-studio-section="qualitative"] img.interpolation-image').forEach(image=>{
   if(image.closest('.cogniroute-figure'))return;
   const frame=el('figure','cogniroute-figure');image.before(frame);frame.append(image);
  });
 }
 function feature({main,nav,zoomable}) {
  const section=el('section','studio-feature cogniroute-feature');section.setAttribute('aria-labelledby','cogniroute-feature-title');
  const title=el('h2','','Social reasoning starts with the right evidence.');title.id='cogniroute-feature-title';
  section.append(el('div','cogniroute-label','Video, audio, and language'),title,el('p','cogniroute-feature-intro','Understanding a request or a polite refusal takes more than hearing the words. CogniRoute learns to connect gestures, vocal cues, and conversational context through expert routing.'));
  const frame=el('figure','cogniroute-figure');frame.append(openingImage,el('figcaption','','Social inference on VR smart glasses: resolving a gesture-guided request and recognizing a hesitant, polite refusal.'));section.append(frame);
  const result=el('p','cogniroute-opening-result');result.append(el('strong','','59.38% average accuracy on OmniSocialBench'),document.createTextNode(' · 15.33 percentage points above the strongest proprietary baseline.'));section.append(result);nav.after(section);
  main.querySelectorAll('.cogniroute-figure').forEach(figure=>{
   const image=figure.querySelector('img');zoomable(image,figure);
   const button=figure.querySelector('.studio-zoom'),icon=el('i','fa-solid fa-expand');icon.setAttribute('aria-hidden','true');button.replaceChildren(document.createTextNode('Expand'),icon);
   const toolbar=el('div','cogniroute-figure-toolbar');toolbar.append(button);figure.append(toolbar);
  });
 }
 window.PLANCogniRoute={prepare,feature};
})();
