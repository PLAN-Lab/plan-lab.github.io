/* LaTtE-Flow presentation: neutral prose, balanced affiliations, legible ablations. */
(() => {
 'use strict';
 function prepare(main) {
  main.querySelectorAll('[data-studio-section="method"] p').forEach(p=>{if(p.textContent.includes('keeps the pretrained VLM frozen, so it does not lose any understanding ability'))p.remove();});
  const affiliations=main.querySelector('.studio-affiliations');
  if(affiliations) {
   const items=[...affiliations.children];affiliations.replaceChildren();
   [items.slice(0,4),items.slice(4)].forEach(group=>{const row=document.createElement('div');row.className='latte-affiliation-row';row.append(...group);affiliations.append(row);});
  }
  main.querySelectorAll('.equal-note').forEach(note=>{note.innerHTML='<sup>*</sup>Equal contribution &nbsp;·&nbsp; <sup>†</sup>Co-corresponding authors';});
  const ablations=main.querySelector('[data-studio-section="ablations"]');
  if(ablations) {
   const row=ablations.querySelector('.fig-row');row.classList.add('latte-ablation-panels');
   const figures=[...row.querySelectorAll('.studio-native-result')];
   figures.forEach((figure,index)=>{
    const p=document.createElement('p');p.className='studio-result-description';
    p.textContent=index===0?'Layerwise timestep experts reach a lower FID in fewer training steps than the Vanilla baseline.':'Larger expert groups improve FID but take longer to run. A group of seven layers is used in the main results. Bubble area represents model size.';
    figure.querySelector('h3').after(p);figure.querySelector('.studio-result-note')?.remove();
   });row.replaceChildren(...figures);
  }
 }
 window.PLANLatteFlow={prepare};
})();
