/* PyraTok: complete benchmark comparisons and original rollout video galleries. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 const sv=(tag,attrs,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!=null)n.textContent=text;return n;};
 const recon=[['recon-1080p-1','1080p · example 1'],['recon-1080p-3','1080p · example 2'],['recon-4k-1','4K · example 1'],['recon-4k-4','4K · example 2']];
 function videoCard(folder,id,label) {
  const card=el('figure','pyratok-video-card'),video=el('video');video.src=`static/videos/${folder}/${id}.mp4`;video.muted=true;video.autoplay=true;video.loop=true;video.controls=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label',label);
  card.append(video,el('figcaption','',label));return card;
 }
 async function prepare(main) {
  const response=await fetch('static/data/benchmarks.json?v=reviewed-project-pages-e418f00-v1');if(!response.ok)throw new Error('PyraTok benchmark data unavailable');const {tasks}=await response.json();
  const result=main.querySelector('[data-studio-section="quantitative"] > .container');
  const dashboard=el('figure','studio-native-result pyratok-benchmark-dashboard');dashboard.dataset.resultSource='paper:2601.16210:tables-2-5';dashboard.append(el('h3','','Beyond reconstruction: generation and understanding'));
  const intro=el('p','studio-result-description','Ten benchmarks cover reconstruction, generation, segmentation, action localization, and video understanding. The reconstruction comparison appears above. Choose a task below to explore the remaining results.');dashboard.append(intro);
  const tabs=el('div','pyratok-task-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','PyraTok evaluation tasks');
  const panel=el('div','pyratok-task-panel');panel.setAttribute('role','tabpanel');panel.id='pyratok-task-panel';
  function show(task,button) {
   [...tabs.children].forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});panel.setAttribute('aria-labelledby',button.id);panel.replaceChildren(el('h4','',task.title),el('p','pyratok-task-description',task.description));
   const controls=el('div','pyratok-metric-controls'),label=el('label','','Benchmark / metric'),select=el('select');select.id='pyratok-benchmark-metric';label.htmlFor=select.id;
   task.columns.forEach((column,index)=>{if(task.rows.some(row=>typeof row[index]==='number')){const option=el('option','',column);option.value=index;select.append(option);}});select.value=task.defaultColumn ?? 1;controls.append(label,select);panel.append(controls);
   const chart=el('div','studio-svg-scroll pyratok-comparison-chart');chart.tabIndex=0;panel.append(chart);
   function draw() {
    const index=Number(select.value),rows=task.rows.filter(row=>typeof row[index]==='number'),maximum=Math.max(...rows.map(row=>row[index]))*1.12,w=850,left=265,right=65,top=28,step=42,h=top+rows.length*step+45,plotWidth=w-left-right;
    const svg=sv('svg',{viewBox:`0 0 ${w} ${h}`,role:'img','aria-label':task.title+' — '+task.columns[index]}),x=value=>left+value/maximum*plotWidth;
    for(let i=0;i<=4;i++){const value=maximum*i/4;svg.append(sv('line',{x1:x(value),x2:x(value),y1:top-12,y2:h-40,class:'studio-grid'}),sv('text',{x:x(value),y:h-15,'text-anchor':'middle'},Number(value.toFixed(1))));}
    rows.forEach((row,i)=>{const y=top+i*step,ours=row[0].includes('PyraTok'),name=row[0]+(typeof row[1]==='string' && ['Supervised','Unsupervised','Zero-shot'].includes(row[1])?' · '+row[1]:'');
     svg.append(sv('text',{x:left-12,y:y+18,'text-anchor':'end'},name));const bar=sv('rect',{x:left,y,width:Math.max(x(row[index])-left,1),height:24,rx:4,fill:ours?'#ff915b':'#83afd9',tabindex:0});bar.append(sv('title',{},name+': '+row[index]));svg.append(bar,sv('text',{x:x(row[index])+10,y:y+18},row[index]));
    });chart.replaceChildren(svg);
   }
   select.addEventListener('change',draw);draw();
   const details=el('details','pyratok-full-scores');details.append(el('summary','','All model scores'));
   const scroll=el('div','studio-table-scroll');scroll.tabIndex=0;const table=el('table','studio-native-table');table.dataset.benchmarkSource=task.source;
   const thead=el('thead'),header=el('tr');task.columns.forEach(column=>{const th=el('th','',column);th.scope='col';header.append(th);});thead.append(header);const body=el('tbody');task.rows.forEach(row=>{const tr=el('tr',row[0].includes('PyraTok')?'studio-ours':'');row.forEach((value,index)=>{const cell=el(index===0?'th':'td','',value ?? '—');if(index===0)cell.scope='row';tr.append(cell);});body.append(tr);});table.append(thead,body);scroll.append(table);details.append(scroll);panel.append(details);
  }
  tasks.forEach((task,index)=>{const button=el('button','',task.title);button.type='button';button.id='pyratok-task-'+task.id;button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);button.addEventListener('click',()=>show(task,button));button.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tasks.length-1:(index+(event.key==='ArrowRight'?1:-1)+tasks.length)%tasks.length;tabs.children[next].click();tabs.children[next].focus();}});tabs.append(button);});dashboard.append(tabs,panel);result.append(dashboard);show(tasks[0],tabs.children[0]);
  const qualitative=main.querySelector('[data-studio-section="qualitative"] > .container'),heading=qualitative.querySelector('h2');
  qualitative.replaceChildren(heading,el('h3','','Text-to-video generation'));const generation=el('div','pyratok-generation-grid');[['t2v-motionaura','MotionAura + PyraTok'],['t2v-magvit','MAGVITv2 + PyraTok'],['t2v-omnigen','OmniGenV2 + PyraTok']].forEach(([id,label])=>generation.append(videoCard('t2v',id,label)));qualitative.append(generation);
  qualitative.append(el('h3','pyratok-attention-title','Text-guided video localization'),el('p','pyratok-attention-intro','PyraTok’s attention maps highlight the objects named in a text query. The clips below show responses to bikes, Nike shoes, and a football.'));
  const attention=el('div','pyratok-attention-grid');
  [['bikes','Bikes','Two bikes cruising on the road.'],['nike-shoes','Nike shoes','Player in Nike shoes kicking a football.'],['football','Football','Player in Nike shoes kicking a football.']].forEach(([id,target,prompt])=>{
   const card=videoCard('attention',id,target),caption=card.querySelector('figcaption'),query=el('p','pyratok-text-query');query.append(el('strong','','Prompt: '),document.createTextNode(prompt));caption.replaceChildren(el('h4','pyratok-attention-target',target),query);attention.append(card);
  });qualitative.append(attention);
 }
 function feature({main,nav}) {
  const section=el('section','section studio-opening-examples pyratok-opening'),box=el('div','container is-max-desktop'),grid=el('div','pyratok-reconstruction-grid');recon.forEach(([id,label])=>grid.append(videoCard('recon',id,label)));box.append(grid);section.append(box);nav.after(section);
 }
 window.PLANPyraTok={prepare,feature};
})();
