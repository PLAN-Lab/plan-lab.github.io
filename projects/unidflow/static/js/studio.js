/* UniDFlow: readable stage diagrams and explanations before their results. */
(() => {
 'use strict';
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function stage(title,paragraphs) {
  const item=el('article','unidflow-training-stage');item.append(el('h3','',title));
  paragraphs.forEach(text=>item.append(el('p','',text)));return item;
 }
 function prepare(main) {
  const method=main.querySelector('[data-studio-section="method"] > .container');
  const heading=method.querySelector('h2');
  const first=method.querySelector('img[src$="arch_stage_1_2.jpg"]');
  const third=method.querySelector('img[src$="arch_stage_3.jpg"]');
  [first,third].forEach(image=>{image.remove();image.removeAttribute('style');image.removeAttribute('class');});
  first.alt='UniDFlow text and vision alignment: separate text and image LoRA adapters trained with discrete flow matching';
  third.alt='UniDFlow multimodal preference alignment with a Mixture-of-LoRA router, reference image, edited image, and reflection';
  method.replaceChildren(heading,el('p','unidflow-method-intro','UniDFlow learns understanding and generation through separate adapters on a frozen backbone, then combines them for reasoning-guided editing. The three training stages isolate the two objectives before aligning their joint behavior.'));
  const alignment=el('div','unidflow-alignment'),figure=el('figure','unidflow-alignment-figure'),copy=el('div','unidflow-alignment-copy');
  figure.append(first);
  copy.append(stage('Stage I · Text alignment',[
   'Text LoRA adapters learn to answer visual instructions using discrete flow matching. The backbone remains frozen, and KL regularization preserves linguistic ability while the model develops multimodal reasoning.',
   'This stage establishes the understanding pathway that later guides image editing.'
  ]),stage('Stage II · Vision alignment',[
   'A separate image LoRA learns conditional generation in discrete visual-token space. The text adapters remain frozen, preserving their reasoning capability while image generation is trained.',
   'Separating the adapters prevents the understanding and generation objectives from competing for the same parameters.'
  ]));alignment.append(figure,copy);method.append(alignment);
  const preference=stage('Stage III · Multimodal preference alignment',[
   'A lightweight Mixture-of-LoRA (MoRA) router dynamically composes the text and image adapters during diffusion. The model can combine visual reasoning with image synthesis at each step.',
   'Multimodal Reference-based DPO (mRef-DPO) compares outcomes under identical conditioning against a frozen reference policy and a visual reference image. Structured reflection traces train the model to reason through geometric, physical, and temporal changes before producing the edit.'
  ]);preference.classList.add('unidflow-preference');const preferenceFigure=el('figure','unidflow-preference-figure');preferenceFigure.append(third);preference.append(preferenceFigure);method.append(preference);
  main.querySelector('.hero.teaser')?.remove();

  const quantitative=main.querySelector('[data-studio-section="quantitative"] > .container');
  const quantitativeHeading=quantitative.querySelector('h2');
  const results=[...quantitative.querySelectorAll('.studio-native-result')];
  const descriptions=[
   'UniDFlow (4B) is evaluated on general multimodal question answering and visual reasoning. Compared with BAGEL, it achieves gains of +6.9% on MME-P and +7.0% on MME-S.',
   'UniDFlow (4B) outperforms same-scale unified competitors and larger generative models on text-to-image generation.'
  ];
  results.forEach((result,index)=>result.querySelector('h3').after(el('p','studio-result-description',descriptions[index])));
  quantitative.replaceChildren(quantitativeHeading,...results);
  main.querySelectorAll('[data-studio-section="qualitative"] .unidflow-qualitative').forEach(content=>{
   const paragraphs=[...content.querySelectorAll(':scope > p')];
   content.prepend(...paragraphs);
  });
 }
 window.PLANUniDFlow={prepare};
})();
