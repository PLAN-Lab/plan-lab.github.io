# DreamPartGen gallery assets

The two archives were supplied in the project's shared Google Drive folder:
https://drive.google.com/drive/folders/1LCwfdUJRpRAr_t3B1IBkfxuZiAfvg6L4

`archives.json` records their IDs and SHA-256 checksums. The importer accepts only GLB and PNG files and skips macOS metadata.

To reproduce the web assets from the repository root:

```sh
npm ci --prefix scripts/glb-gallery
python3 scripts/glb-gallery/download.py /tmp/project-glbs
node scripts/glb-gallery/prepare.mjs /tmp/project-glbs
```

The web copies preserve scene geometry and hierarchy, deduplicate shared data, and use lossless Meshopt compression without quantizing vertex data. Textures use lossless WebP only when it reduces size. Legacy specular/gloss materials are converted for model-viewer compatibility. Input images use WebP. Source credits remain in the GLB metadata and the generated gallery manifest.

Preparation decodes every resulting GLB and verifies the rendered triangle count, scene bounds, node count, and animation count against the input. DreamPartGen’s comparison viewers load automatically as they enter the viewport. Part editing and mini-scene comparisons sit inside Qualitative Results. The mini-scene uses the nine supplied components matching the meshes in `scene2_texture.glb`.

The vendored model-viewer 4.0.0 loads its Meshopt decoder as a **classic script**. Use `meshopt_decoder.js`, which defines the global `MeshoptDecoder`; the ES module build cannot be used with this loader. Verify the deployed decoder format and all compressed buffers with:

```sh
node scripts/glb-gallery/check-decoder.mjs
```
