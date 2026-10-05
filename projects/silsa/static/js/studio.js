/* SILSA keeps topology supervision and example descriptions with their figures. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function prepare(main) {
  main.querySelector('.topology-block h3').textContent='Slice-wise topology supervision and inter-slice consistency';
  const stage=main.querySelector('.gallery-stage'),foot=main.querySelector('.gallery-foot'),box=el('div','silsa-gallery-box');
  foot.children[1]?.remove();stage.before(box);box.append(stage,foot);
  const comparison=main.querySelector('.comparison-figure').closest('.studio-subsection');comparison.classList.add('silsa-reconstruction-box');comparison.querySelector('.compare-columns')?.remove();
  const citation=main.querySelector('[data-studio-section="bibtex"] > .container'),citationHeading=citation.querySelector('h2'),code=citation.querySelector('pre');citation.replaceChildren(citationHeading,code);
 }
 function feature({main,nav}) {
  const teaser=main.querySelector('.hero.teaser'),image=teaser.querySelector('img[src$="teaser.webp"]'),section=el('section','section studio-opening-examples'),box=el('div','container is-max-desktop'),figure=el('figure','studio-example-card'),frame=el('div','studio-example-media');
  image.alt='SILSA-generated 3D shapes with thin structures and detailed geometry';image.loading='eager';frame.append(image);
  const caption=el('figcaption','studio-opening-caption');caption.append(el('h2','studio-opening-label','Topology-preserving high-resolution 3D generation'),el('p','','SILSA generates detailed 3D geometry from an image using 384 slice tokens.'));figure.append(frame,caption);box.append(figure);section.append(box);teaser.remove();nav.after(section);
 }
 window.PLANSILSA={prepare,feature};
})();
