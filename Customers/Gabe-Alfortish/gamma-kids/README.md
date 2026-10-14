# GAMMA KIDS — kids.gammamuseum.studio

Client: **Gabe Alfortish** · Brand: **GAMMA MUSEUM** (sub-brand GAMMA KIDS)
Design & development: **MURCIELACO**

Static one-page site (HTML + CSS + JS, no build step). Status: **Coming soon**: the three models are not on sale yet.

## Structure

```
gamma-kids/
├── index.html          # page
├── styles.css          # all styles (palette and fonts at the top)
├── main.js             # gallery, lightbox, scroll reveal, toy drop-in
├── music.js            # background music (original music-box loop, WebAudio) for the hero play button
├── game.js             # LAMBO RUSH mini game (canvas + WebAudio, no dependencies)
├── netlify.toml        # hosting config (Netlify), optional
└── assets/
    ├── fonts/          # self-hosted Fredoka, Fraunces, Space Grotesk (OFL)
    ├── svg/            # GAMMA wordmark + "M" column logo (from gammamuseum.studio), favicon
    └── img/
        ├── hero/       # background-removed pairs lying on the play mat (webp + png)
        ├── lambo/      # gallery JPGs (xx.jpg = large, xx-sm.jpg = thumbnail)
        ├── magma/
        ├── squirrels/
        └── og.jpg      # social share image
```

## Models and renders used

| Model | Hero on the play mat (no background) | Gallery (in order) |
|---|---|---|
| LAMBO | `LAMBO` (pair, top view) | LAMBO, (6), (5), (2), (7), (8) |
| MAGMA | `MAGMA (15)` (pair, top view) | (14), (1), (10), (11), (15), (9) |
| SQUIRRELS | `SQUIRRELS (8)` (pair + sole, top view) | (6), (10), (1), (7), (3), (8) |

Gallery images are JPG, 1800 px max (q90) plus 800 px thumbnails.

## LAMBO RUSH (mini game, section `#play`)

- The car is MURCIELACO's own illustration (`assets/img/game/lambo-car.png`, nose up). A vector fallback is drawn until it loads.
- 3-lane top-down runner drawn in `<canvas>` (logical 360×640, scales to any width).
- Controls: ← → or A D on desktop (Space/Enter/W to start); tap left/right half, swipe, or the on-screen pads on phones.
- Obstacles: squirrels and lava holes. Coins = +50. Distance adds points continuously; speed ramps from 250 to 820 px/s.
- Music and sound effects are generated live with WebAudio (no audio files). Mute button remembers the choice.
- Best score is kept in the visitor's browser (localStorage). The game pauses when scrolled out of view or the tab is hidden.
- Tuning lives at the top of `update()` / `spawnRow()` in `game.js` (speed ramp, row gap, obstacle odds).

## Editing

- **Copy:** directly in `index.html` (one `<section class="product">` per model).
- **Colors:** CSS variables in `:root` at the top of `styles.css`.
- **When they go on sale:** replace each `<span class="btn-soon">Coming soon</span>` with a link
  (e.g. to the Zellerfeld collection) and remove the `COMING SOON` ticker/band if wanted.

## Deploy (free) on the client's domain

1. Netlify / Cloudflare Pages / Vercel → new site from this folder
   (base directory `Customers/Gabe-Alfortish/gamma-kids`, no build command, publish `.`).
2. Add custom domain `kids.gammamuseum.studio`.
3. At the DNS (Wix → Domains → gammamuseum.studio → DNS records) add a **CNAME**:
   `kids` → the host's target (e.g. `<site>.netlify.app`).
4. The main site `gammamuseum.studio` stays on Wix. No extra Wix plan is needed.

Local preview: `python3 -m http.server` inside this folder → http://localhost:8000
