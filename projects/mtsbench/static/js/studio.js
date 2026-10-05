/* mTSBench package scale and evaluation coverage, using verified suite counts. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function prepare(main) {
  main.querySelector('[data-studio-section="method"]').remove();
  const dataset=main.querySelector('[data-studio-section="dataset"] > .container'),heading=dataset.querySelector('h2'),table=dataset.querySelector('[data-result-source="static/images/datasets.png"]');
  heading.textContent='The mTSBench Package';
  const intro=el('p','mts-package-intro','mTSBench brings datasets, anomaly detectors, model selectors, and evaluation tools into one reproducible package. Load a labeled multivariate series, run a detector through a common interface, and compare accuracy, event coverage, and runtime. The same suite evaluates which detector a selector recommends for new data.');
  const stats=el('dl','studio-package-stats mts-stats');
  [['344','Labeled time series'],['19','Datasets'],['12','Application domains'],['24','Anomaly detectors'],['12','Detection metrics'],['3','Model selectors']].forEach(([value,label])=>{const item=el('div');item.append(el('dt','',value),el('dd','',label));stats.append(item);});
  const coverage=el('div','mts-package-coverage');coverage.append(el('h3','','What the evaluation covers'));
  const grid=el('div','studio-explainer-grid');
  [['Point detection','Precision, Recall, and Standard-F1 assess individual anomalous timestamps. AUC-PR and AUC-ROC compare score quality across thresholds.'],['Events and ranges','PA-F1, Event-based-F1, R-based-F1, and Affiliation-F evaluate anomaly intervals. AUC-PₜRₜ, VUS-PR, and VUS-ROC measure range-aware detection across thresholds and temporal tolerances.'],['Detector recommendations','MetaOD, FMMS, and Orthus recommend detectors without anomaly labels at selection time. Precision@k, Recall@k, and NDCG@k assess which recommendations recover strong detectors and how well they are ranked.']].forEach(([title,text])=>{const card=el('article','studio-explainer-card');card.append(el('h4','',title),el('p','',text));grid.append(card);});coverage.append(grid);
  const detectors=el('div','mts-detectors');detectors.append(el('h3','','From classical detectors to language models'),el('p','','The 24 detectors span distance and density methods, isolation and clustering, statistical and subspace models, neural reconstruction and forecasting, and language-model approaches. This breadth supports comparisons across model families under one evaluation interface.'));
  const names=el('div','mts-detector-list');['ALLM4TS','AutoEncoder','CBLOF','CNN','COPOD','Donut','EIF','FITS','HBOS','IForest','KMeansAD','KNN','LOF','LSTMAD','MCD','OCSVM','OFA','OmniAnomaly','PCA','RobustPCA','TimesNet','TranAD','Transformer','USAD'].forEach(name=>names.append(el('span','',name)));detectors.append(names);
  const domains=el('p','mts-domain-description','The datasets cover healthcare, cybersecurity, industrial processes and automation, spacecraft telemetry, cloud computing, IT infrastructure, smart buildings, finance, transportation, water quality, human activity, and synthetic anomalies. They include both isolated anomalous points and sustained anomaly sequences.');
  const links=el('div','studio-package-links');[['Use the package','https://github.com/PLAN-Lab/mTSBench#start'],['Browse datasets','https://huggingface.co/datasets/PLAN-Lab/mTSBench']].forEach(([label,url])=>{const a=el('a','',label);a.href=url;links.append(a);});
  dataset.replaceChildren(heading,intro,stats,coverage,detectors,domains,links,table);
  table.querySelector('h3').textContent='Dataset coverage';
 }
 function feature({main,nav}) {
  const teaser=main.querySelector('.hero.teaser'),image=teaser.querySelector('img'),section=el('section','section studio-opening-examples'),box=el('div','container is-max-desktop'),figure=el('figure','studio-example-card'),frame=el('div','studio-example-media');
  image.removeAttribute('style');image.alt='mTSBench unifies datasets, metrics, model selection, and anomaly detection';image.loading='eager';frame.append(image);
  const caption=el('figcaption','studio-opening-caption');caption.append(el('h2','studio-opening-label','One package for detection and model selection'),el('p','','A common evaluation suite connects diverse multivariate datasets with anomaly detectors and unsupervised model selectors.'));figure.append(frame,caption);box.append(figure);section.append(box);teaser.remove();nav.after(section);
 }
 window.PLANmTSBench={prepare,feature};
})();
