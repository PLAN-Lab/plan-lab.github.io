const BASE = 'static/videos/comparisons/';
const CASES = [
  {id:'subject_appearance_elephant',label:'Blue elephant',prompt:"Change the elephant's color to blue.",files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_pyramidedit.mp4','Pyramid-Edit'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'environment_appearance_waves',label:'Black waves',prompt:'Change the turquoise waves to black.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_tokenflow.mp4','TokenFlow'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'style_ukiyo_e',label:'Ukiyo-e',prompt:'Convert the video style to ukiyo-e.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_tokenflow.mp4','TokenFlow'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'dynamic_phenomenon_fire',label:'Blue fire',prompt:'Change the color of the fire to blue.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_tokenflow.mp4','TokenFlow'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'multi_object_attribute_lemons',label:'Red lemons',prompt:'Change the lemons to red.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_tokenflow.mp4','TokenFlow'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'part_eyes',label:'Blue eyes',prompt:"Make the wolf's eyes blue.",files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_pyramidedit.mp4','Pyramid-Edit'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'part_hair',label:'White hair',prompt:"Change the person's hair color to white.",files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_pyramidedit.mp4','Pyramid-Edit'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'style_pixel',label:'Pixel style',prompt:'Convert the video to a pixel style.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_tokenflow.mp4','TokenFlow'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'style_van_gogh',label:'Van Gogh',prompt:'Change the video to Vincent van Gogh art style.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['2_pyramidedit.mp4','Pyramid-Edit'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'global_tone_black_white',label:'Black & white',prompt:'Convert the video to black and white.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'weather_illumination_starry_night',label:'Starry night',prompt:'Change the weather to a starry night sky.',files:[['0_source.mp4','Source'],['1_vidtome.mp4','VidToMe'],['3_wanedit.mp4','Wan-Edit'],['4_flowdirector.mp4','FlowDirector'],['5_streamedit.mp4','StreamEdit'],['6_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]},
  {id:'subject_guided_edit',label:'Subject-guided',prompt:'Change the duck to the chicken in the reference image.',subject:true,files:[['0_source.mp4','Source'],['1_anyv2v.mp4','AnyV2V'],['2_vidtome.mp4','VidToMe'],['3_pyramidedit.mp4','Pyramid-Edit'],['4_wanedit.mp4','Wan-Edit'],['5_flowdirector.mp4','FlowDirector'],['6_streamedit.mp4','StreamEdit'],['7_editvid_ours.mp4','EᴅɪᴛVɪᴅ (Ours)']]}
];

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.video-compare').forEach(compare=>{
    const slider=compare.querySelector('input[type="range"]');
    const source=compare.querySelector('.source-video');
    const edited=compare.querySelector('.edited-video');
    slider.addEventListener('input',()=>compare.style.setProperty('--split',`${slider.value}%`));
    const synchronize=()=>{if(Math.abs(source.currentTime-edited.currentTime)>.12)edited.currentTime=source.currentTime};
    source.addEventListener('timeupdate',synchronize);
    source.addEventListener('play',()=>edited.play().catch(()=>{}));
    source.addEventListener('pause',()=>edited.pause());
    source.addEventListener('seeking',()=>{edited.currentTime=source.currentTime});
    edited.addEventListener('loadedmetadata',()=>{edited.currentTime=source.currentTime;if(!source.paused)edited.play().catch(()=>{})},{once:true});
  });
  const tabs=document.querySelector('.case-tabs'),grid=document.querySelector('#video-grid'),prompt=document.querySelector('#case-prompt');
  if(!tabs||!grid)return;
  let playing=true;
  const videos=()=>[...grid.querySelectorAll('video')];
  function setButton(){document.querySelector('#toggle-play').innerHTML=playing?'<i class="fa-solid fa-pause"></i><span>Pause all</span>':'<i class="fa-solid fa-play"></i><span>Play all</span>'}
  function toggle(){playing=!playing;videos().forEach(v=>playing?v.play().catch(()=>{}):v.pause());setButton()}
  function render(item){
    prompt.textContent=item.prompt;document.querySelector('#reference-panel').hidden=!item.subject;
    tabs.querySelectorAll('button').forEach(b=>{const on=b.dataset.case===item.id;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
    grid.innerHTML=item.files.map(([file,name])=>`<article class="video-card ${name.includes('Ours')?'ours':''}"><div class="video-label"><span>${name}</span>${name.includes('Ours')?'<b>Ours</b>':''}</div><video muted loop playsinline preload="metadata" aria-label="${name} result"><source src="${BASE}${item.id}/${file}" type="video/mp4"></video></article>`).join('');
    const list=videos();let ready=0;list.forEach((v,index)=>{v.playbackRate=Number(document.querySelector('#playback-rate').value);v.addEventListener('loadedmetadata',()=>{if(index===0&&v.videoWidth&&v.videoHeight)grid.style.setProperty('--case-aspect',`${v.videoWidth}/${v.videoHeight}`);ready++;if(ready===list.length){list.forEach(x=>x.currentTime=0);if(playing)list.forEach(x=>x.play().catch(()=>{}))}},{once:true});v.addEventListener('click',toggle)});
  }
  CASES.forEach(c=>{const b=document.createElement('button');b.type='button';b.role='tab';b.dataset.case=c.id;b.textContent=c.label;b.onclick=()=>render(c);tabs.appendChild(b)});
  document.querySelector('#toggle-play').addEventListener('click',toggle);
  document.querySelector('#playback-rate').addEventListener('change',e=>videos().forEach(v=>v.playbackRate=Number(e.target.value)));
  render(CASES[0]);
});
