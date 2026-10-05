/* CALICO presentation uses the original task, method and segmentation figures. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!=null)node.textContent=text;return node;};
 let taskImage,taskCaption;
 async function prepare(main) {
  await new Promise((resolve,reject)=>{
   const style=document.createElement('link');style.rel='stylesheet';style.href='static/css/studio.css?v=reviewed-project-pages-e418f00-v1';
   style.onload=resolve;style.onerror=()=>reject(new Error('CALICO presentation styles unavailable'));document.head.append(style);
  });
  const teaser=main.querySelector('.hero.teaser');
  taskImage=teaser.querySelector('img.interpolation-image');
  taskImage.alt='CALICO identifies and segments common objects, common parts, and unique parts across a pair of images.';
  taskCaption=teaser.querySelector('.content');
  taskImage.remove();taskCaption.remove();teaser.remove();
  main.querySelectorAll('.publication-venue').forEach(node=>node.remove());
  const venue=el('p','publication-venue','CVPR 2025');
  main.querySelector('.studio-header .studio-affiliations').after(venue);

  // The original source put both presentation embeds in the abstract container.
  const abstract=main.querySelector('[data-studio-section="abstract"]');
  const presentation=el('section','section');presentation.id='studio-presentation';presentation.dataset.studioSection='presentation';
  const container=el('div','container is-max-desktop');const title=el('h2','title is-3','Video & Poster');title.id='calico-presentation-title';
  presentation.setAttribute('aria-labelledby',title.id);container.append(title);presentation.append(container);
  [...abstract.querySelectorAll('h2')].filter(heading=>/^(Video|Poster)$/.test(heading.textContent.trim())).forEach(heading=>{
   const block=heading.closest('.columns');block.className='calico-presentation-block';
   const subheading=el('h3','',heading.textContent.trim());heading.replaceWith(subheading);
   block.querySelectorAll('.column,.container').forEach(node=>node.className='calico-presentation-content');
   const iframe=block.querySelector('iframe');iframe.title=`CALICO ${subheading.textContent.toLowerCase()}`;
   if(iframe.hasAttribute('data-pdf-src')) {
    iframe.classList.add('calico-poster');
    const link=el('a','calico-poster-link','Open poster PDF');link.href=iframe.dataset.pdfSrc;link.target='_blank';link.rel='noopener';subheading.after(link);
   }
   container.append(block);
  });
  main.querySelector('[data-studio-section="bibtex"]').before(presentation);

  main.querySelectorAll('table tbody th[scope="row"]').forEach(cell=>{cell.textContent=cell.textContent.replace(/\s*\[\d+(?:\s*,\s*\d+)*\]/g,'');});
  const results=main.querySelector('[data-result-source="static/images/results.png"]');
  results.before(results.nextElementSibling);
  results.querySelectorAll('tr.studio-ours td').forEach(cell=>{const mark=el('strong');mark.append(...cell.childNodes);cell.append(mark);});
  ['[data-studio-section="method"] img.interpolation-image','[data-studio-section="dataset"] img.interpolation-image'].forEach(selector=>{
   const image=main.querySelector(selector);const figure=el('figure','calico-figure');image.before(figure);figure.append(image);
  });

  // Each context pairing has its own answer and separation from the next pairing.
  const qualitative=main.querySelector('[data-studio-section="qualitative"]');
  const context=qualitative.querySelector('.qual-example:last-child');const divider=context.querySelector('hr');
  const secondContext=el('div','qual-example');context.after(secondContext);
  while(divider.nextSibling)secondContext.append(divider.nextSibling);divider.remove();
  const labels=['Common object · person','Common object · car','Common parts','Unique parts','Context-dependent object · dog','Context-dependent object · car'];
  qualitative.querySelectorAll('.qual-example').forEach((example,index)=>{
   example.classList.remove('qual-left-aspect');example.classList.add('calico-example');
   example.prepend(el('h3','calico-example-title',labels[index]));
   const pairs=[...example.querySelectorAll('.image-container')];
   pairs.forEach((pair,row)=>{
    if(pairs.length>1)pair.before(el('div','calico-pair-label',row===0?'Objects':index===2?'Common parts':'Unique parts'));
    [...pair.querySelectorAll('img')].forEach((image,column)=>{
     image.classList.remove('image');image.removeAttribute('style');
     image.alt=`CALICO ${labels[index].toLowerCase()}, ${pairs.length>1?(row===0?'objects':'parts')+', ':''}image ${column+1}`;
     const frame=el('div','calico-example-frame');image.before(frame);frame.append(image);
    });
   });
   example.querySelector('.caption').classList.add('calico-example-answer');
  });
 }
 function feature({main,nav,zoomable}) {
  const expand=(image,frame)=>{
   zoomable(image,frame);
   const icon=el('i','fa-solid fa-expand');icon.setAttribute('aria-hidden','true');
   const button=frame.querySelector('.studio-zoom');button.replaceChildren(document.createTextNode('Expand'),icon);
   const toolbar=el('div','calico-figure-toolbar');toolbar.append(button);frame.append(toolbar);
  };
  const section=el('section','studio-feature calico-feature');section.setAttribute('aria-labelledby','calico-feature-title');
  const heading=el('h2','','Common objects. Shared and unique parts.');heading.id='calico-feature-title';
  section.append(el('div','calico-label','Multi-image, pixel-grounded understanding'),heading);
  const figure=el('figure','calico-task-figure');figure.append(taskImage);expand(taskImage,figure);section.append(figure);
  taskCaption.className='calico-task-caption';section.append(taskCaption);nav.after(section);
  main.querySelectorAll('.calico-figure,.calico-example-frame').forEach(frame=>expand(frame.querySelector('img'),frame));
 }
 window.PLANCalico={prepare,feature};
})();
