/* Native, accessible result views. Data lives in assets/data/project-results/*.json. */
(() => {
 'use strict';
 const assetVersion = window.PLAN_PROJECT_ASSET_VERSION || 'reviewed-project-pages-e418f00-v1';
 const colors=['#83afd9','#b2c9e1','#507ca7','#d3deeb','#ff915b'];
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const entrance=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
  if(!isIntersecting)return;entrance.unobserve(target);
  if(reducedMotion)return;
  const bars=target.querySelectorAll('.studio-bar');
  if(bars.length)bars.forEach((bar,i)=>bar.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:450,delay:Math.min(i*15,180),easing:'ease-out',fill:'backwards'}));
  else target.querySelectorAll('svg').forEach(svg=>svg.animate([{opacity:0},{opacity:1}],{duration:350}));
 }),{threshold:.08});
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 let resultData={};
 const sv=(tag,attrs={},text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!=null)n.textContent=text;return n;};
 function shell(spec){const figure=el('figure','studio-native-result');figure.dataset.resultSource=spec.source;figure.append(el('h3','',spec.title));return figure;}
 function note(figure,spec){if(spec.note)figure.append(el('figcaption','studio-result-note',spec.note));}
 function overview(spec){
  const figure=shell(spec);figure.classList.add('studio-overview');const steps=el('ol','studio-overview-steps');
  spec.steps.forEach(([title,description],i)=>{const step=el('li');step.append(el('span','studio-step-index',`0${i+1}`),el('h3','',title),el('p','',description));steps.append(step);});
  figure.append(steps);note(figure,spec);return figure;
 }
 function table(spec){
  const figure=shell(spec);const scroll=el('div','studio-table-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',spec.title);
  const t=el('table','studio-native-table');const caption=el('caption','studio-sr-only',spec.title);const head=el('thead');const tr=el('tr');
  if(spec.columnGroups){
   const groups=el('tr'),method=el('th','',spec.columns[0]);method.scope='col';method.rowSpan=2;groups.append(method);
   spec.columnGroups.forEach(group=>{const th=el('th','',group.label);th.scope='colgroup';th.colSpan=group.span;groups.append(th);});head.append(groups);
  }
  spec.columns.forEach((label,index)=>{if(spec.columnGroups && index===0)return;const th=el('th','',label);th.scope='col';tr.append(th);});head.append(tr);t.append(caption,head);let body=el('tbody');
  spec.rows.forEach(row=>{
   const r=el('tr');
   if(row.group){if(body.children.length){t.append(body);body=el('tbody');}r.className='studio-group';const th=el('th','',row.group);th.colSpan=spec.columns.length;th.scope='rowgroup';r.append(th);}
   else {if(spec.highlight ? spec.highlight.some(name=>String(row[0]).includes(name)) : /Ours|3D-VCD|CALICO|CoRe3D|DreamPartGen|VisAnomReasoner|MMPlanner|PRIMA|PyraTok|RewardFlow|UniDFlow|PALM|RobustSeg|Part²GS|SpatialReasoner/i.test(row[0]))r.classList.add('studio-ours');row.forEach((value,i)=>{const cell=el(i===0?'th':'td','',value);if(i===0)cell.scope='row';r.append(cell);});}
   body.append(r);
  });t.append(body);
  if(spec.rankMetrics)t.dataset.rankMetrics='true';
  if(spec.rankMetrics)[...t.tBodies].forEach(group=>{
   const rows=[...group.rows].filter(row=>!row.classList.contains('studio-group'));
   spec.columns.forEach((label,column)=>{
    if(!column || !/[↑↓]/.test(label))return;
    const values=rows.map(row=>Number(row.cells[column].textContent)),ranks=[...new Set(values.filter(Number.isFinite))].sort((a,b)=>label.includes('↓')?a-b:b-a);
    rows.forEach((row,index)=>{
     const rank=values[index]===ranks[0]?'best':values[index]===ranks[1]?'second':null;if(!rank)return;
     const cell=row.cells[column],mark=el(rank==='best'?'strong':'u',`studio-${rank}`);mark.append(...cell.childNodes);cell.append(mark);
    });
   });
  });
  if(spec.description)figure.querySelector('h3').after(el('p','studio-result-description',spec.description));
  scroll.append(t);figure.append(scroll);note(figure,spec);return figure;
 }
 function chart(spec){
  const figure=shell(spec);const controls=el('div','studio-result-controls');const container=el('div');const metrics=spec.metrics || [{label:spec.yLabel || 'Value',series:spec.series}];
  if(metrics.length>1){const label=el('label','','Metric ');const select=el('select');select.setAttribute('aria-label',`${spec.title} metric`);metrics.forEach((m,i)=>{const option=el('option','',m.label);option.value=i;select.append(option);});label.append(select);controls.append(label);select.addEventListener('change',()=>draw(metrics[Number(select.value)]));figure.append(controls);}
  figure.append(container);
  function draw(metric){
   container.replaceChildren();
   const series=metric.series;const categories=metric.categories || spec.categories || [];
   const legend=el('div','studio-legend');series.forEach((s,i)=>{const label=el('span');const mark=el('i');mark.style.setProperty('--series-color',s.color || colors[i%colors.length]);label.append(mark,document.createTextNode(s.name));legend.append(label);});container.append(legend);
   if(spec.type==='bars'){
    const names=categories.length?categories:series[0].values.map((_,i)=>String(i+1));const vals=series.flatMap(s=>s.values).filter(v=>Number.isFinite(v));const max=metric.max || spec.max || Math.max(...vals,1);
    const step=spec.compact?18:23,groupHeight=series.length*step+(spec.compact?8:22);const h=names.length*groupHeight+70;const svg=sv('svg',{viewBox:`0 0 850 ${h}`,role:'img','aria-label':`${spec.title}: ${metric.label}`});
    const left=spec.compact?180:220,width=spec.compact?600:545;
    for(let t=0;t<=4;t++){const value=max*t/4,x=left+width*t/4;svg.append(sv('line',{x1:x,x2:x,y1:25,y2:h-35,class:'studio-grid'}),sv('text',{x,y:h-12,'text-anchor':'middle'},Number(value.toFixed(2))));}
    names.forEach((name,i)=>{
     const y=35+i*groupHeight;svg.append(sv('text',{x:left-14,y:y+12,'text-anchor':'end'},name));
     series.forEach((s,j)=>{const v=s.values[i];if(!Number.isFinite(v))return;const yy=y+j*step;const rect=sv('rect',{x:left,y:yy,width:Math.max(v/max*width,1),height:spec.compact?13:16,rx:3,fill:s.color || colors[j%colors.length],class:'studio-bar',tabindex:0});rect.append(sv('title',{},`${name} · ${s.name}: ${v}${metric.unit || ''}`));svg.append(rect,sv('text',{x:left+v/max*width+8,y:yy+12},`${v}${metric.unit || ''}`));});
    });svg.append(sv('text',{x:12,y:h-12},metric.label));appendSvg(svg);
   } else {
    const w=850,h=410,left=72,top=25,right=32,bottom=70;const pw=w-left-right,ph=h-top-bottom;
    const all=series.flatMap(s=>s.points || s.values.map((v,i)=>[i,v]));const xmin=spec.xMin ?? Math.min(...all.map(v=>v[0])),xmax=spec.xMax ?? Math.max(...all.map(v=>v[0]));const ymin=metric.min ?? spec.yMin ?? 0,ymax=metric.max ?? spec.yMax ?? Math.max(...all.map(v=>v[1]),1);
    const x=v=>left+(v-xmin)/(xmax-xmin || 1)*pw,y=v=>top+ph-(v-ymin)/(ymax-ymin || 1)*ph;
    const svg=sv('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':`${spec.title}: ${metric.label}`});
    for(let i=0;i<=4;i++){const v=ymin+(ymax-ymin)*i/4;svg.append(sv('line',{x1:left,x2:left+pw,y1:y(v),y2:y(v),class:'studio-grid'}),sv('text',{x:left-12,y:y(v)+4,'text-anchor':'end'},Number(v.toFixed(2))));}
    const ticks=spec.xTicks || [...new Set(all.map(p=>p[0]))];ticks.forEach(v=>svg.append(sv('text',{x:x(v),y:top+ph+24,'text-anchor':'middle'},categories.length?categories[v]:v)));
    svg.append(sv('line',{x1:left,x2:left+pw,y1:top+ph,y2:top+ph,class:'studio-axis'}),sv('text',{x:left+pw/2,y:h-15,'text-anchor':'middle'},spec.xLabel || ''),sv('text',{x:18,y:top+ph/2,transform:`rotate(-90 18 ${top+ph/2})`,'text-anchor':'middle'},metric.label));
    series.forEach((s,i)=>{
     const points=s.points || s.values.map((v,j)=>[j,v]);const color=s.color || colors[i%colors.length];
     if(spec.type!=='scatter')svg.append(sv('path',{d:points.map((p,j)=>`${j?'L':'M'}${x(p[0])},${y(p[1])}`).join(' '),fill:'none',stroke:color,'stroke-width':2.5,'stroke-dasharray':i===0 && series.length>1?'6 4':''}));
     points.forEach((p,j)=>{const c=sv('circle',{cx:x(p[0]),cy:y(p[1]),r:spec.type==='scatter'?(s.radii?.[j] || 6):4,fill:color,opacity:.9,tabindex:0});c.append(sv('title',{},`${s.name}: ${spec.approximate?'approximately ':''}${categories[j] || p[0]}, ${p[1]}`));svg.append(c);if(s.labels?.[j])svg.append(sv('text',{x:x(p[0]),y:y(p[1])-10,'text-anchor':'middle'},s.labels[j]));});
    });appendSvg(svg);
   }
   function appendSvg(svg){const scroll=el('div','studio-svg-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label',spec.title);scroll.append(svg);container.append(scroll);entrance.observe(svg);}
  }
  draw(metrics[0]);note(figure,spec);return figure;
 }
 function heatmap(spec){
  const figure=shell(spec),cell=28,left=160,top=120,w=left+spec.columns.length*cell+40,h=top+spec.rows.length*cell+80;
  const svg=sv('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':spec.title});
  spec.columns.forEach((label,i)=>{const x=left+i*cell+15;svg.append(sv('text',{x,y:top-12,transform:`rotate(-55 ${x} ${top-12})`},label));});
  const minimum=spec.min ?? 0,maximum=spec.max ?? 1;
  const scale=v=>spec.logScale?Math.log10(v):v;
  const colorAt=ratio=>`rgb(${Math.round(15+120*ratio)},${Math.round(33+143*ratio)},${Math.round(56+166*ratio)})`;
  spec.rows.forEach((label,i)=>{const y=top+i*cell;svg.append(sv('text',{x:left-12,y:y+19,'text-anchor':'end'},label));spec.values[i].forEach((value,j)=>{
   const ratio=Math.max(0,Math.min(1,(scale(value)-scale(minimum))/(scale(maximum)-scale(minimum))));
   const rect=sv('rect',{x:left+j*cell,y,width:cell-1,height:cell-1,fill:colorAt(ratio),tabindex:0});
   const description=`${label} · ${spec.columns[j]}: ${spec.approximate?'approximately ':''}${value} ${spec.unit || ''}`;
   rect.setAttribute('aria-label',description);rect.append(sv('title',{},description));svg.append(rect);
   if(!spec.approximate){const label=sv('text',{x:left+j*cell+cell/2,y:y+18,'text-anchor':'middle',class:'studio-cell-value'},value.toFixed(2));label.style.fill=ratio>.55?'#071222':'#edf5ff';svg.append(label);}
  });});
  const ly=h-48,lw=spec.columns.length*cell;
  for(let i=0;i<100;i++)svg.append(sv('rect',{x:left+i*lw/100,y:ly,width:lw/100+1,height:8,fill:colorAt(i/99)}));
  for(let i=0;i<=4;i++){const ratio=i/4,value=spec.logScale?10**(scale(minimum)+ratio*(scale(maximum)-scale(minimum))):minimum+ratio*(maximum-minimum);svg.append(sv('text',{x:left+ratio*lw,y:ly+27,'text-anchor':'middle'},`${Number(value.toFixed(2))}${spec.unit==='s'?' s':''}`));}
  svg.append(sv('text',{x:18,y:ly+8},spec.unit || 'Value'));
  const scroll=el('div','studio-svg-scroll');scroll.tabIndex=0;scroll.append(svg);figure.append(scroll);entrance.observe(svg);note(figure,spec);return figure;
 }
 function boxplot(spec){
  const figure=shell(spec);const selectors=el('div','studio-result-controls'),select=el('select');select.setAttribute('aria-label',`${spec.title} metric`);spec.metrics.forEach((m,i)=>{const o=el('option','',m.label);o.value=i;select.append(o);});selectors.append(select);figure.append(selectors);const holder=el('div','studio-svg-scroll');holder.tabIndex=0;figure.append(holder);
  function draw(metric){holder.replaceChildren();const left=150,step=26,w=850,h=spec.categories.length*step+70,range=metric.max || 1;const svg=sv('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':metric.label});const x=v=>left+v/range*620;
   for(let i=0;i<=4;i++){const v=range*i/4;svg.append(sv('line',{x1:x(v),x2:x(v),y1:20,y2:h-40,class:'studio-grid'}),sv('text',{x:x(v),y:h-15,'text-anchor':'middle'},Number(v.toFixed(2))));}
   spec.categories.forEach((name,i)=>{const y=28+i*step;const [lo,q1,med,q3,hi]=metric.values[i];svg.append(sv('text',{x:left-15,y:y+4,'text-anchor':'end'},name),sv('line',{x1:x(lo),x2:x(hi),y1:y,y2:y,stroke:'#83afd9'}),sv('line',{x1:x(lo),x2:x(lo),y1:y-5,y2:y+5,stroke:'#83afd9'}),sv('line',{x1:x(hi),x2:x(hi),y1:y-5,y2:y+5,stroke:'#83afd9'}));const box=sv('rect',{x:x(q1),y:y-7,width:Math.max(x(q3)-x(q1),1),height:14,fill:'#83afd933',stroke:'#83afd9'});const estimate=spec.approximate?'≈ ':'';box.append(sv('title',{},`${name}: Q1 ${estimate}${q1}, median ${estimate}${med}, Q3 ${estimate}${q3}`));svg.append(box,sv('line',{x1:x(med),x2:x(med),y1:y-7,y2:y+7,stroke:'#ff915b','stroke-width':2}));});holder.append(svg);
  }select.addEventListener('change',()=>draw(spec.metrics[Number(select.value)]));draw(spec.metrics[0]);note(figure,spec);return figure;
 }
 async function render(main,slug){
  const version=assetVersion;
  const response=await fetch(`../../assets/data/project-results/${encodeURIComponent(slug)}.json?v=${version}`);
  if(response.status===404)return; if(!response.ok)throw new Error(`Result data HTTP ${response.status}`);
  const data=await response.json();resultData=data;
  for(const [filename,spec] of Object.entries(data)){
   const targets=[...main.querySelectorAll('img')].filter(img=>decodeURIComponent(new URL(img.src).pathname).split('/').pop()===filename);
   for(const image of targets){
    let host=image.parentElement;
   const make=s=>s.type==='overview'?overview(s):s.type==='table'?table(s):s.type==='heatmap'?heatmap(s):s.type==='boxplot'?boxplot(s):chart(s);
   const figure=make(spec);
    const replacement=spec.extra?el('div','studio-native-group'):figure;
    if(spec.extra)replacement.append(figure,...spec.extra.map(make));
    if(host.classList.contains('media-card'))host.replaceWith(replacement);else image.replaceWith(replacement);
    let ancestor=figure.parentElement;
    while(ancestor && !ancestor.classList.contains('container') && ancestor!==main){ancestor.classList.add('studio-result-host');ancestor=ancestor.parentElement;}
   }
  }
 }
 function append(main){
  Object.values(resultData).filter(spec=>spec.appendTo).forEach(spec=>{
   const section=main.querySelector(`[data-studio-section="${spec.appendTo}"] > .container`);
   if(!section)throw new Error(`Missing result section: ${spec.appendTo}`);
   section.append(table(spec));
  });
 }
 async function format(main,slug,zoomable){
  const response=await fetch('../../assets/data/project-result-panels.json?v='+assetVersion);
  if(!response.ok)throw new Error(`Result panel metadata HTTP ${response.status}`);
  const metadata=(await response.json()).projects[slug] || {};
  main.querySelectorAll('[data-studio-section="quantitative"]').forEach(section=>{
   const box=section.querySelector(':scope > .container'),heading=section.querySelector('h2');
   const units=[...box.querySelectorAll('.studio-native-result,table,img')].filter(node=>node.matches('.studio-native-result') || !node.closest('.studio-native-result'));
   const before=(a,b)=>!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
   const sourceHeadings=[...box.querySelectorAll('h3,h4')].filter(node=>!node.closest('.studio-native-result'));
   const candidates=[...box.querySelectorAll('.content,p,.result-highlights,.studio-result-callout')].filter(node=>
    node.textContent.trim() && !node.closest('.studio-native-result,footer,.efficiency-callout') &&
    !node.querySelector('.studio-native-result,table,img,svg,video,iframe')
   );
   const blocks=candidates.filter(node=>!candidates.some(parent=>parent!==node && parent.contains(node)));
   const introductions=[],copy=new Map(units.map(unit=>[unit,[]]));
   blocks.forEach(block=>{
    if(block.matches('.studio-results-intro')){introductions.push(block);return;}
    const specified=/^htmlTable:(\d+)$/.exec(block.dataset.resultFor || '');
    if(specified){
     const target=units.filter(unit=>unit.matches('table'))[Number(specified[1])];
     if(target){copy.get(target).push(block);return;}
    }
    const scope=block.closest('.studio-result-host,.studio-subsection,.benchmark-pane');
    const scoped=scope?units.filter(unit=>scope.contains(unit)):[];
    if(scoped.length===1){copy.get(scoped[0]).push(block);return;}
    const previous=units.filter(unit=>before(unit,block)).at(-1),next=units.find(unit=>before(block,unit));
    const subheading=sourceHeadings.filter(node=>before(node,block)).at(-1);
    if(!previous && !subheading){introductions.push(block);return;}
    const target=next && (!previous || (subheading && before(previous,subheading)))?next:previous || next;
    if(target)copy.get(target).push(block);else introductions.push(block);
   });
   units.forEach(unit=>{
    const original=[...unit.querySelectorAll(':scope > .studio-result-description,:scope > p')].filter(node=>
     !node.matches('.studio-result-note,.ece-chart-scroll-hint,.studio-sr-only')
    );
    copy.set(unit,[...original,...copy.get(unit)].sort((a,b)=>before(a,b)?-1:before(b,a)?1:0));
   });
   introductions.forEach(node=>{node.classList.add('studio-results-intro');node.remove();});
   const stack=el('div','studio-result-stack');let tableIndex=0;
   units.forEach((unit,index)=>{
    let card,title,description;
    if(unit.matches('.studio-native-result')){
     card=unit;title=card.querySelector('h3');description=metadata[title.textContent.trim()];
    }else if(unit.matches('table')){
     description=metadata[`htmlTable:${tableIndex++}`] || {};
     card=el('figure','studio-native-result');title=el('h3','',description.title || unit.caption?.textContent || 'Benchmark comparison');card.append(title);
     const scroll=unit.closest('.studio-table-scroll') || el('div','studio-table-scroll');
     if(!scroll.contains(unit))scroll.append(unit);card.append(scroll);
    }else{
     const filename=decodeURIComponent(new URL(unit.src).pathname).split('/').pop();description=metadata[`image:${filename}`] || {};
     card=el('figure','studio-native-result');title=el('h3','',description.title || unit.alt || 'Evaluation setup');
     const frame=el('div','studio-result-media'),controls=unit.parentElement.querySelector('.studio-zoom');
     frame.append(unit);if(controls)frame.append(controls);else zoomable(unit,frame);card.append(title,frame);
    }
    card.classList.add('studio-result-card');title.classList.add('studio-result-title');
    if(!title.id)title.id=`studio-result-${index}`;card.setAttribute('aria-labelledby',title.id);
    // Move the original explanations above their own result, preserving links,
    // emphasis, notes, and the original media and control nodes.
    const paragraphs=copy.get(unit);
    if(paragraphs.length){
     const explanation=paragraphs.length===1?paragraphs[0]:el('div','content');
     if(paragraphs.length>1)paragraphs.forEach(node=>{
      if(node.matches('.content'))explanation.append(...node.childNodes);else explanation.append(node);
     });
     explanation.classList.add('studio-result-description');title.after(explanation);
    }else if(description?.description)title.after(el('p','studio-result-description',description.description));
    card.querySelectorAll('table').forEach(table=>{
     table.classList.add('studio-native-table');if(table.caption)table.caption.classList.add('studio-sr-only');
     table.querySelectorAll('thead th').forEach(cell=>{if(!cell.scope)cell.scope=cell.colSpan>1?'colgroup':'col';});
     table.querySelectorAll('tbody tr').forEach(row=>{
      const cell=row.cells[0];if(!cell || cell.tagName!=='TD' || cell.colSpan>1 || /^[\d.]/.test(cell.textContent.trim()))return;
      const label=el('th',cell.className);[...cell.attributes].forEach(attr=>label.setAttribute(attr.name,attr.value));label.scope='row';label.append(...cell.childNodes);cell.replaceWith(label);
     });
    });
    card.querySelectorAll('.studio-table-scroll').forEach(scroll=>{scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label',title.textContent);scroll.removeAttribute('style');});
    stack.append(card);
   });
   // Keep the original efficiency callout visible above the benchmark cards.
   stack.prepend(...box.querySelectorAll('.efficiency-callout'));
   // Retain legacy footer nodes for the shared footer's acknowledgement pass.
   box.querySelectorAll('footer').forEach(footer=>main.append(footer));
   box.replaceChildren(heading,...introductions,stack);
   section.classList.add('studio-quantitative');
  });
  main.dataset.studioResultsReady='true';
 }
 window.PLANResults={render,append,format};
})();
