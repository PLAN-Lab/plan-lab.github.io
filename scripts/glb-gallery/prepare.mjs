import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NodeIO,Logger} from '@gltf-transform/core';
import {ALL_EXTENSIONS,EXTMeshoptCompression} from '@gltf-transform/extensions';
import {dedup,prune,reorder,textureCompress,metalRough,getBounds} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import sharp from 'sharp';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const source=path.resolve(process.argv[2]);
await MeshoptEncoder.ready;await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const groups={dreampartgen_partedit:'projects/dreampartgen/static/models/part-editing',dreampartgen_miniscene:'projects/dreampartgen/static/models/mini-scenes',silsa_highres:'projects/silsa/static/models/high-resolution',silsa_imgto3d:'projects/silsa/static/models/image-to-3d'};
const manifest=[];
function stats(doc){
 const scenes=doc.getRoot().listScenes();
 let triangles=0;
 for(const s of scenes)s.traverse(n=>{const m=n.getMesh();if(m)for(const p of m.listPrimitives()){if(p.getMode()===4)triangles+=(p.getIndices()?.getCount()||p.getAttribute('POSITION').getCount())/3;}});
 return {triangles,nodes:doc.getRoot().listNodes().length,animations:doc.getRoot().listAnimations().length,bounds:scenes.map(getBounds)};
}
for(const [group,folder] of Object.entries(groups)){
 const target=path.join(root,folder);await fs.mkdir(target,{recursive:true});
 const names=(await fs.readdir(path.join(source,group))).sort();
 for(const name of names.filter(n=>n.endsWith('.glb'))){
  const input=path.join(source,group,name),output=path.join(target,name);
  const doc=await io.read(input);doc.setLogger(new Logger(Logger.Verbosity.ERROR));
  const credits=structuredClone(doc.getRoot().getAsset().extras||{});const before=stats(doc);
  const converted=doc.getRoot().listExtensionsUsed().some(e=>e.extensionName==='KHR_materials_pbrSpecularGlossiness');
  if(converted)await doc.transform(metalRough());
  await doc.transform(dedup(),prune({keepLeaves:true}),reorder({encoder:MeshoptEncoder}));
  // Keep original textures whenever a lossless WebP would increase the download.
  const textures=doc.getRoot().listTextures();const originals=new Map(textures.map(t=>[t,{image:t.getImage(),mime:t.getMimeType()}]));
  await doc.transform(textureCompress({encoder:sharp,targetFormat:'webp',lossless:true,effort:4}));
  for(const t of textures){const old=originals.get(t);if(t.getImage().byteLength>=old.image.byteLength)t.setImage(old.image).setMimeType(old.mime);}
  doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
  await io.write(output,doc);
  const after=stats(await io.read(output));
  if(before.triangles!==after.triangles||before.nodes!==after.nodes||before.animations!==after.animations)throw Error('Scene structure changed: '+name);
  if(JSON.stringify(before.bounds)!==JSON.stringify(after.bounds)){
   const a=before.bounds.flatMap(x=>[...x.min,...x.max]),b=after.bounds.flatMap(x=>[...x.min,...x.max]);
   if(a.some((v,i)=>!Number.isFinite(v)||Math.abs(v-b[i])>1e-5*Math.max(1,Math.abs(v))))throw Error('Bounds changed: '+name);
  }
  const entry={group,name,path:folder+'/'+name,bytes:(await fs.stat(output)).size,credits,converted,triangles:after.triangles};manifest.push(entry);
  console.log(group,name,entry.bytes);
 }
 for(const name of names.filter(n=>n.endsWith('.png')))await sharp(path.join(source,group,name)).webp({quality:94}).toFile(path.join(target,name.replace(/\.png$/,'.webp')));
}
if(manifest.length!==34)throw Error('Expected 34 GLBs, found '+manifest.length);
await fs.mkdir(path.join(root,'assets/data'),{recursive:true});
await fs.writeFile(path.join(root,'assets/data/glb-galleries.json'),JSON.stringify(manifest,null,2)+'\n');
const vendor=path.join(root,'assets/vendor/meshoptimizer');await fs.mkdir(vendor,{recursive:true});
for(const name of ['meshopt_decoder.module.js','LICENSE.md'])await fs.copyFile(path.join(here,'node_modules/meshoptimizer',name),path.join(vendor,name));
await fs.writeFile(path.join(vendor,'README.md'),'# Meshoptimizer decoder\n\nVersion 0.24.0 (MIT), used by DreamPartGen and SILSA.\n');
console.log('Validated',manifest.length,'models; total bytes:',manifest.reduce((n,x)=>n+x.bytes,0));
