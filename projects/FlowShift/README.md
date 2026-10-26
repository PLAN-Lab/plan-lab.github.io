# FlowShift — project page (WACV 2027)

Static site. No build step. Open `index.html` through a local server, or host it on GitHub Pages.

## Folder

```
index.html            the page
support.js            page runtime (keep next to index.html)
vendor/nocturne/      styles
assets/
  hero/               mosaic images (also used by the hero)
  gallery/            "Same prompt, sharper result" images
  fig3-pipeline.jpg   method figure
  FlowShift_WACV2027.pdf
.nojekyll             tells GitHub Pages to serve files as-is
```

## Swap the gallery images

Easiest: replace the files in `assets/gallery/` and keep the same names:

- `uni-1-d.jpg` … `uni-6-d.jpg`: UniDFlow-4B, discrete
- `uni-1-c.jpg` … `uni-6-c.jpg`: UniDFlow-4B + FlowShift
- `fud-1-d.jpg` … `fud-6-c.jpg`: same for FUDOKI

Square images look best (they are shown 1:1, centre-cropped).

To use other names or formats, or to add or remove examples, open `index.html`, search for **GALLERY**,
and edit the `SETS` list. Each item has `title`, `discrete`, `flowshift` and `prompt`.

## Other quick edits (search in index.html)

- arXiv / Code buttons: find `>arXiv<` and `>Code<` and replace `href="#"` with your links.
- BibTeX: search `@inproceedings`.
- Mosaic images: replace files in `assets/hero/` (same names).

## Preview locally

The page loads images with relative paths, so use a local server rather than double-clicking:

```
cd flowshift-site
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages

1. Create a repo (e.g. `flowshift`) and push the contents of this folder to the root.
2. On GitHub, go to Settings → Pages → Source: *Deploy from a branch* → `main` / root.
3. Your page will be at `https://<username>.github.io/flowshift/`.

Internet access is needed when viewing (fonts, icons and React load from public CDNs).
