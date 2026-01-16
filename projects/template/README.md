# Project Page Template

1. Copy this folder:
   - `cp -R simple-site/projects/template simple-site/projects/<your-slug>`
2. Update `simple-site/projects/<your-slug>/index.html`:
   - Title, venue/year, authors
   - Buttons (Paper / arXiv / Code / Dataset / Demo / Video / Slides)
   - Teaser image (put under `simple-site/projects/<your-slug>/static/images/`)
   - Sections (Abstract, Method, Results, Citation, etc.)
3. (Optional) If you link authors as `/team/<id>`, it auto-rewrites to the new site profile pages.

After adding a new project folder, link it from the relevant publication’s `links.website` entry in `scholar-lite/src/content/publications/*.md` (then re-run `npm run sync:content`).
