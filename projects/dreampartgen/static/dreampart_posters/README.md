These 24 posters are extracted from the midpoint of the corresponding original MP4 files in `../dreampart_videos/`. They provide visible previews before playback and respect reduced-motion preferences.

Generated with FFmpeg using `-ss <half the source duration> -frames:v 1 -vf scale=480:-2 -q:v 3 -threads 1`. The source videos are unchanged.
