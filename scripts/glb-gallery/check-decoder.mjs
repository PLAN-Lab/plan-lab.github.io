/* Regress the real failure: model-viewer 4.0 loads Meshopt as a classic script. */
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const page=await fs.readFile(path.join(root,'projects/dreampartgen/index.html'),'utf8');
const decoderPath=page.match(/meshoptDecoderLocation: new URL\('([^']+)'/)[1];
const source=await fs.readFile(path.resolve(root,'projects/dreampartgen',decoderPath),'utf8');
const context=vm.createContext({console});
new vm.Script(source,{filename:decoderPath}).runInContext(context);
const decoder=context.MeshoptDecoder;
assert(decoder?.supported,'Classic script must expose a supported global MeshoptDecoder');
await decoder.ready;
const models=JSON.parse(await fs.readFile(path.join(root,'assets/data/glb-galleries.json'),'utf8'));
let buffers=0;
for(const model of models){
 const bytes=await fs.readFile(path.join(root,model.path));
 assert.equal(bytes.readUInt32LE(0),0x46546c67);
 const jsonLength=bytes.readUInt32LE(12);
 const gltf=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
 const binary=bytes.subarray(28+jsonLength);
 for(const view of gltf.bufferViews||[]){
  const ext=view.extensions?.EXT_meshopt_compression;
  if(!ext)continue;
  assert.equal(ext.buffer,0);
  const data=binary.subarray(ext.byteOffset||0,(ext.byteOffset||0)+ext.byteLength);
  const decoded=new Uint8Array(ext.count*ext.byteStride);
  decoder.decodeGltfBuffer(decoded,ext.count,ext.byteStride,data,ext.mode,ext.filter);
  buffers++;
 }
}
console.log(`Classic-script decoder loaded and decoded ${buffers} compressed buffers in ${models.length} GLBs.`);
