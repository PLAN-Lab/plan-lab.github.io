# PLAN Lab Website

This folder is a standalone static site. Team members, publications, and news are rendered from JSON in `assets/data/`.

## Update content

### Adding a news item
- Edit `assets/data/news.json` and add an entry at the top of the `news` array:
```
    {
      "id": "YYYY-short-slug",                # permanent anchor on news.html (news.html#news-YYYY-short-slug)
      "date": "YYYY-MM-DD",                   # also accepts "YYYY-MM" or "YYYY"; items are sorted by this
      "title": "2 papers at X 2026!",
      "description": "One or two sentences shown on the card.",
      "image": "assets/images/publications/xyz.webp", # optional; use the publication cover images
      "banner": "assets/images/news/xyz.webp",# optional; homepage-only image (conference banner/logo art, cropped to fill)
      "imageFit": "cover",                    # optional; images render like publications (contained, white box); cover crops photos to fill
      "icon": "fa-solid fa-trophy",           # optional Font Awesome class, used when there is no image
      "link": "publications.html",            # optional; used as the More target only when the item has no papers/body
      "linkLabel": "More",                    # optional; custom label for that link
      "body": ["Optional longer paragraph shown on the item's detail page."],
      "papers": [                             # optional; gives the item a detail page listing these papers
        { "pubId": "2026-LastName-paper-slug" },        # reference into publications.json (rendered from there)
        {                                                # OR an inline paper that is NOT on the publications list
          "title": "Full Paper Title",
          "authors": ["Firstname Lastname"],             # lab members are auto-linked to their profiles
          "venueAbbr": "ECCV 2026", "year": 2026,
          "cover": "assets/images/news/xyz.webp",        # optional
          "links": { "paper": "https://...", "code": "https://..." },
        }
      ]
    }
```
- Remove the comments before saving; JSON does not support comments.
- The homepage shows the 4 most recent items. `news.html` lists everything, grouped by year.
- The More button routing: `link` always wins when set; otherwise the item's detail page (`news.html?id=<id>`).
- On `news.html`, items whose `papers` resolve to 2+ publication covers rotate through them as a small carousel; the homepage card stays static (`banner` first, then `image`).
- To link a news item to a filtered publications view instead, use `"link": "publications.html?q=ECCV 2026"` (the publications search supports `?q=` prefill).

### Adding a publication
- Edit `assets/data/publications.json` and add images under `assets/images/publications/`.
```
    {
      "id": "2025-LastName-paper-title-2-3-words",
      "title": "Title",
      "projectName": "Project Abbreviation",
      "authors": [
        "Firstname Lastname",
        "Firstname Lastname", # important to use this format for lab members to link to their profile
      ],
      "jointFirstAuthors": [
        "Firstname Lastname" # optional; members listed here are prioritized like first authors on profile pages
      ],
      "year": YYYY,
      "date": "YYYY-MM-DD",
      "venue": "venue",
      "type": "paper",
      "cover": "assets/images/publications/file_name",
      "doi": "", # this or paper link is mandatory
      "links": {
        "website": "/projects/Abbreviation/",
        "paper": "https://paper-url", # link to paper pdf
        "code": "https://github.com/PLAN-Lab/project-name", 
        "video": "",
        "data": "",
      },
      "cardCover": "assets/images/cards/filename" # only for papers on home page
      "venueAbbr": "" # venue Abbreviation such as CVPR, NeurIPS, or arXiv, etc.
    }
```
- Make sure to remove the comments from above block after the edits, comments are not supported in json.
- Add publication cover image under `assets/images/publications/` (ideally use a 4:3 aspect ratio)
- For papers on home page, add card cover image under `assets/images/cards/`
- Send a pull request

### Adding a member
- Edit `assets/data/team.json` 
```
    {
      "id": "firstname-lastname", # permanent URL slug; never include member status
      "group": "pi/phd/masters/undergrad/alumni",
      "name": "Firstname Lastename", # don't add aliases here, add them in the aliases field
      "displayName": "Firstname (Alias) Lastname", # optional custom display formatting
      "aliases": [
        "alias1"
      ]
      "role": "PhD Student", # PhD Student/Masters Student/Undergraduate/Alumni
      "title": [
        "PhD Student" # PhD Student/Masters Student/Undergraduate/Former Masters Student/Former PhD Student/Former Undergraduate
      ],
      "currently": "", # current position, if alumni
      "avatar": "assets/images/team/firstname-lastname.jpg",
      "email": "id@illinois.edu",
      "github": "https://github.com/username",
      "website": "https://website-url",
      "linkedin": "https://www.linkedin.com/in/username/",
      "googleScholar": "https://scholar.google.com/citations?user=xxxx",
      "twitter": "https://twitter.com/username",
      "bio": "" # Take a look at other bios with same role/title for reference,
    },
```
- Add profile picture under `assets/images/team/` as `firstname-lastname.jpg`
- Link project-page authors with `/team/firstname-lastname`; `assets/js/project-pages.js` resolves it to the member profile.
- To change a member's status, update `group`, `role`, `title`, and `currently` as needed. Do not change `id` or project links.
- Send a pull request

## Projects

To create a new project page:

- Copy `simple-site/projects/template/` to `simple-site/projects/<slug>/`
- Edit `simple-site/projects/<slug>/index.html`

## Images

Use WebP for all images (`cwebp` or Pillow). Card covers up to 1600px wide,
publication thumbnails up to 960px, team avatars up to 640px. Animated GIFs
should be converted to animated WebP. Anything over ~300 KB on a card or
thumbnail is too big.

## Short links (plan-lab.github.io/<project>)

Short links redirect through `404.html`. A slug map at the top of that file
redirects known projects before the page paints. When adding a project,
add its folder name to the `SLUGS` map in `404.html` (or leave it: unknown
slugs are probed automatically with a short delay before redirecting).
