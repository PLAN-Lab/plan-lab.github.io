# Phantom — Project Page

**Phantom: Physics-Infused Video Generation via Joint Modeling of Visual and Latent Physical Dynamics**
Ying Shen, Jerry Xiong, Tianjiao Yu, Ismini Lourentzou — UIUC · CVPR 2026

---

## File structure

```
projects/phantom/
├── index.html                  # Main project page
├── static/
│   ├── Phantom_cvpr.pdf        # Paper PDF (already here)
│   ├── images/
│   │   ├── teaser.png          # Teaser figure (hero section)
│   │   └── method.png          # Architecture diagram (Fig. 2 in paper)
│   └── videos/
│       ├── t2v/                # Text-to-Video comparisons
│       ├── ti2v/               # Text-/Image-to-Video comparisons
│       └── force/              # Force-conditioned generation
└── README.md
```

---

## Adding assets

### Teaser & method figures
- Place at `static/images/teaser.png` and `static/images/method.png`.
- The placeholders in `index.html` will be replaced automatically once you swap in the `<img>` tags (search for `[ Teaser figure` and `[ Method diagram`).

---

## Video comparison sections

The page has three tabbed comparison sections matching the paper's qualitative figures.

### Tab 1 — Text-to-Video (Fig. 1a, 3, 5 in paper)

Baselines: **Wan2.1-T2V**, **CogVideoX-5B**, **WISA**, **VideoREPA**, **Wan2.2-TI2V** (base), **Phantom (Ours)**

| Row | Prompt |
|-----|--------|
| 1 | *A colorful rubber ball is dropped from a height, showing the bounce of the ball as it makes contact with the hard floor.* |
| 2 | *A balloon changes from large to small.* |
| 3 | *A coffee pot pours a morning cup of joe.* |

Expected video paths:
```
static/videos/t2v/ball_wan21.mp4
static/videos/t2v/ball_cogvideox.mp4
static/videos/t2v/ball_wisa.mp4
static/videos/t2v/ball_videorepa.mp4
static/videos/t2v/ball_wan22.mp4
static/videos/t2v/ball_phantom.mp4

static/videos/t2v/balloon_wan21.mp4   ... balloon_phantom.mp4
static/videos/t2v/coffee_wan21.mp4    ... coffee_phantom.mp4
```

To activate a video, replace the `<div class="video-placeholder">` with:
```html
<video src="static/videos/t2v/ball_phantom.mp4" autoplay muted loop playsinline></video>
```

---

### Tab 2 — Text-/Image-to-Video (Fig. 1b, 3, 4 in paper)

Baselines: **CogVideoX1.5-I2V**, **Wan2.2-TI2V** (base), **Phantom (Ours)**
The first frame of each video is the conditioning image (mark with a red border if desired).

| Row | Prompt |
|-----|--------|
| 1 | *The video captures a simple yet visually engaging scene of water being poured into a clear glass.* |
| 2 | *The video captures a serene beach scene at sunset, where a group of people are engaged in creating large, colorful soap bubbles.* |
| 3 | *A thick, viscous blue liquid pours into a bowl, forming folds, splashes, and slow flowing waves.* |

Expected video paths:
```
static/videos/ti2v/water_cogvideox.mp4
static/videos/ti2v/water_wan22.mp4
static/videos/ti2v/water_phantom.mp4

static/videos/ti2v/bubbles_cogvideox.mp4  ... bubbles_phantom.mp4
static/videos/ti2v/liquid_cogvideox.mp4   ... liquid_phantom.mp4
```

---

### Tab 3 — Force-Conditioned Generation (Fig. 6 in paper)

Phantom only — no baselines. The conditioning frame is marked with a red box.
Videos show force-directed motion (toy bus, rocking horse, train, car, sunflower, etc.).

Expected video paths:
```
static/videos/force/bus_left.mp4
static/videos/force/bus_right.mp4
static/videos/force/horse_right.mp4
static/videos/force/horse_left.mp4
static/videos/force/train.mp4
static/videos/force/car.mp4
static/videos/force/sunflower.mp4
```

---

## Quantitative results (already filled in `index.html`)

Results are taken directly from the paper Tables 1–3:

| Benchmark | Key result |
|-----------|-----------|
| VideoPhy | PC +50.4%, SA +14.5% over Wan2.2-TI2V |
| VideoPhy-2 | PC +2.6%, SA +13.1% over Wan2.2-TI2V |
| Physics-IQ (single-frame) | Physics-IQ Score +33.9% over Wan2.2-TI2V |
| VBench-2 | Total 51.84 (+0.5%), Physics 43.61 (+6.0%) |

---

## Updating links

Once arXiv / code / data are available, update the three "coming soon" buttons in the `<div class="publication-links">` section of `index.html`.
