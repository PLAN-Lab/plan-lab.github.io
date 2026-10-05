/* Page-specific presentation; the source abstract, policies, and scores remain intact. */
(() => {
 'use strict';
 const version='reviewed-project-pages-e418f00-v1';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const sv=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([key,value])=>n.setAttribute(key,value));if(text!=null)n.textContent=text;return n;};
 const colors=['#ff6c2f','#fb873d','#ffa85c','#ffc887','#ffdda5'];
 let teaserImage;
 function rank(cells,lower) {
  const values=cells.map(cell=>Number(cell.textContent)),ordered=[...new Set(values)].sort((a,b)=>lower?a-b:b-a);
  cells.forEach((cell,index)=>{
   const place=values[index]===ordered[0]?'best':values[index]===ordered[1]?'second':null;
   if(!place)return;
   const mark=el(place==='best'?'strong':'u',`ece-${place}`);mark.append(...cell.childNodes);cell.append(mark);
  });
 }
 function verticalBars(figure,spec,tableSpec) {
  const title=figure.querySelector('h3');title.textContent='Execution policies and confidence estimation';
  const explanation=el('aside','ece-execution-takeaway');
  explanation.append(el('h4','','Exploring alternatives helps, with diminishing returns.'),el('p','','Action sampling targets uncertainty in planning by comparing alternative action paths. Pairing it with scenario reinterpretation also revisits environmental evidence. However, hypothetical reasoning can introduce additional uncertainty, and repeatedly applying execution policies eventually yields diminishing returns.'));
  const controls=el('div','studio-result-controls'),label=el('label','','Model '),select=el('select');select.setAttribute('aria-label','Execution-policy results model');
  ['GPT-4V','MineLLM','STEVE'].forEach((name,index)=>{const option=el('option','',name);option.value=index;select.append(option);});label.append(select);controls.append(label);
  const legend=el('div','studio-legend');spec.metrics[0].series.forEach((series,index)=>{const item=el('span'),mark=el('i');mark.style.setProperty('--series-color',colors[index]);item.append(mark,document.createTextNode(series.name));legend.append(item);});
  const reference=el('span'),referenceMark=el('i','ece-reference-mark');reference.append(referenceMark,document.createTextNode('Vanilla, no execution policy'));legend.append(reference);
  const charts=el('div','ece-chart-grid');charts.setAttribute('aria-live','polite');
  const scrollHint=el('p','ece-chart-scroll-hint','Scroll horizontally to compare all execution policies.');
  figure.replaceChildren(title,controls,explanation,legend,scrollHint,charts);
  const note=el('figcaption','studio-result-note','ECE measures calibration error (lower is better); AUROC measures failure prediction (higher is better). Dashed lines show Vanilla elicitation without an execution policy.');figure.append(note);
  function draw(model) {
   charts.replaceChildren();
   ['ECE','AUROC'].forEach((metricName,metricIndex)=>{
    const metric=spec.metrics[model*2+metricIndex],modelName=metric.label.split(' · ')[0];
    const baseline=Number(tableSpec.rows[metricIndex*4+model+1][1]);
    const panel=el('div','ece-chart-panel');panel.append(el('h4','',metricName+(metricIndex?' ↑':' ↓')));
    const scroll=el('div','studio-svg-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',`${modelName} ${metricName} vertical bar chart`);
    const svg=sv('svg',{viewBox:'0 0 560 440',role:'img','aria-label':`${modelName}: ${metric.label}. Each group is an execution policy; bars compare elicitation strategies.`});
    const left=48,top=24,bottom=336,width=488,height=bottom-top,max=1,y=value=>bottom-value/max*height;
    for(let tick=0;tick<=5;tick++){
     const value=tick/5;svg.append(sv('line',{x1:left,x2:left+width,y1:y(value),y2:y(value),class:'studio-grid'}),sv('text',{x:left-10,y:y(value)+4,'text-anchor':'end'},Number(value.toFixed(1))));
    }
    svg.append(sv('line',{x1:left,x2:left+width,y1:bottom,y2:bottom,class:'studio-axis'}));
    const referenceY=y(baseline),line=sv('line',{x1:left,x2:left+width,y1:referenceY,y2:referenceY,class:'ece-baseline','stroke-dasharray':'7 5'});line.append(sv('title',{},`${modelName} · ${metricName} · Vanilla, no execution policy: ${baseline}`));svg.append(line);
    const groupWidth=width/spec.categories.length,barWidth=22,gap=4;
    spec.categories.forEach((name,group)=>{
     const center=left+groupWidth*(group+.5),start=center-(metric.series.length*(barWidth+gap)-gap)/2;
     metric.series.forEach((series,index)=>{
      const value=series.values[group],x=start+index*(barWidth+gap),description=`${modelName} · ${metricName} · ${name} · ${series.name}: ${value}`;
      const bar=sv('rect',{x,y:y(value),width:barWidth,height:value/max*height,rx:2,fill:colors[index],class:'ece-vertical-bar',tabindex:0,'aria-label':description});bar.append(sv('title',{},description));
      let labelY=y(value)-7;if(Math.abs(labelY-referenceY)<12)labelY=Math.min(labelY,referenceY-10);
      const text=sv('text',{x:x+barWidth/2,y:labelY,'text-anchor':'middle',class:'ece-bar-value'},value.toFixed(2));svg.append(bar,text);
     });
     const lines=[['Action','sampling'],['Scenario','reinterpretation'],['Hypothetical','reasoning']][group];
     lines.forEach((line,index)=>svg.append(sv('text',{x:center,y:bottom+25+index*17,'text-anchor':'middle'},line)));
    });
    svg.append(sv('text',{x:left+width,y:top-8,'text-anchor':'end',class:'ece-baseline-label'},`Baseline: ${baseline.toFixed(2)}`),sv('text',{x:left+width/2,y:420,'text-anchor':'middle'},'Execution policy'));
    scroll.append(svg);panel.append(scroll);charts.append(panel);
   });
  }
  select.addEventListener('change',()=>draw(Number(select.value)));draw(0);
 }
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=el('link');style.rel='stylesheet';style.href=`static/css/studio.css?v=${version}`;style.onload=resolve;style.onerror=()=>reject(new Error('Uncertainty in Action styles unavailable'));document.head.append(style);
  });
  const header=main.querySelector('.studio-header'),links=header.querySelector('.publication-links');
  if(links.parentElement.classList.contains('column'))links.parentElement.replaceWith(links);
  const teaser=main.querySelector('.hero.teaser');teaserImage=teaser.querySelector('img');const frameworkText=teaserImage.nextElementSibling;
  teaserImage.remove();teaserImage.removeAttribute('style');teaserImage.width=572;teaserImage.height=356;teaserImage.loading='eager';teaserImage.alt='Confidence elicitation at the action and perception stages: an agent evaluates its next action and its observations in a Minecraft environment.';
  frameworkText.removeAttribute('style');main.querySelector('[data-studio-section="method"] .content').prepend(frameworkText);teaser.remove();
  const methodImage=main.querySelector('[data-studio-section="method"] img');methodImage.removeAttribute('style');methodImage.width=1793;methodImage.height=795;methodImage.alt='Embodied confidence elicitation example showing elicitation prompts and scenario reinterpretation at perception and action stages.';methodImage.classList.add('ece-method-image');
  methodImage.nextElementSibling.classList.add('ece-method-caption');
  const results=main.querySelector('[data-studio-section="quantitative"]'),box=results.querySelector(':scope > .container'),title=box.querySelector('h2'),figures=[...results.querySelectorAll('.studio-native-result')];
  const tableCaption=figures[0].nextElementSibling;tableCaption.classList.add('ece-result-caption');
  const takeaway=el('p','ece-result-takeaway','Calibration asks whether stated confidence matches observed success. Failure prediction asks whether confidence distinguishes successful from unsuccessful outcomes. These are different goals: a policy can improve one more than the other.');
  figures[0].querySelector('h3').after(takeaway,tableCaption);
  const table=figures[0].querySelector('table');[...table.tBodies].forEach(body=>{
   const lower=body.querySelector('.studio-group').textContent.includes('↓');[...body.rows].filter(row=>!row.classList.contains('studio-group')).forEach(row=>rank([...row.cells].slice(1),lower));
  });
  box.replaceChildren(title,...figures);
  const response=await fetch(`../../assets/data/project-results/ece.json?v=${version}`);if(!response.ok)throw new Error(`Confidence results HTTP ${response.status}`);const data=await response.json();verticalBars(figures[1],data['r2.png'],data['r1.png']);
 }
 function feature({nav,zoomable,main}) {
  const section=el('section','studio-feature ece-feature');section.setAttribute('aria-labelledby','ece-feature-title');
  const title=el('h2','','Confidence at perception and action stages');title.id='ece-feature-title';section.append(el('div','ece-label','EMBODIED CONFIDENCE ELICITATION'),title);
  const body=el('div','ece-feature-body'),figure=el('figure','ece-figure');figure.append(teaserImage,el('figcaption','','The agent assesses what it sees and the action it plans to take.'));
  const copy=el('div','ece-policy-copy');copy.append(el('p','','Uncertainty in Action studies how embodied agents express confidence when their internal reasoning is inaccessible. The framework combines two policy types:'));
  [['Elicitation policies','Structure how the agent reasons about uncertainty, from direct confidence prompts to inductive, deductive, and abductive reasoning.'],['Execution policies','Expand the assessment through scenario reinterpretation, action sampling, and hypothetical reasoning.']].forEach(([label,text])=>{const item=el('div','ece-policy');item.append(el('h3','',label),el('p','',text));copy.append(item);});
  body.append(figure,copy);section.append(body);nav.after(section);
  [figure,...main.querySelectorAll('.ece-method-image')].forEach(node=>{
   const image=node.matches('img')?node:node.querySelector('img'),toolbar=el('div','ece-figure-toolbar');node.after(toolbar);if(node===figure)figure.append(toolbar);zoomable(image,toolbar);
   toolbar.querySelector('button').replaceChildren(document.createTextNode('Expand '),el('i','fa-solid fa-expand'));
  });
 }
 window.PLANECE={prepare,feature};
})();
