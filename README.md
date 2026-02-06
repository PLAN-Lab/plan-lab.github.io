# PLAN Lab Website

This folder is a standalone static site. Team members and publications are rendered from JSON in `assets/data/`.

## Update content

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
      "id": "phd-firstname-lastname",
      "group": "phd/masters/undergrad/alumni/",
      "name": "Firstname Lastename", # don't add aliases here, add them in the aliases field
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
- Send a pull request

## Projects

To create a new project page:

- Copy `simple-site/projects/template/` to `simple-site/projects/<slug>/`
- Edit `simple-site/projects/<slug>/index.html`
