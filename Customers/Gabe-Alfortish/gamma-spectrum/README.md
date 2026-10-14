# GAMMA SPECTRUM — spectrum.gammamuseum.studio

Client: **Gabe Alfortish** · Brand: **GAMMA MUSEUM** (performance division GAMMA SPECTRUM)
Design & development: **MURCIELACO**

Static one-page site (HTML + CSS + JS, no build step). Status of the three models: **Coming soon**.

## Brand system (from "SPECTRUM - Brand Identity.pdf")

- Colors: Radioactive Green `#00BF63` (primary), Electric Purple `#8C52FF`, Fluorescent Orange `#FF5031`, Deep Black `#000000`.
- Type: the guide specifies **Futura Md BT Italic** (commercial license). The site uses **Jost** italic (OFL), a free Futura-style geometric face, set in uppercase.
  If the client licenses Futura for web, swap the `@font-face` files at the top of `styles.css`.
  Technical labels use JetBrains Mono (OFL).
- Logo: `assets/svg/spectrum-mark.svg`, `spectrum-wordmark.svg`, `spectrum-logo.svg` are vector traces of `logo.jpg`. The mark can face left or right (bidirectional per the guide).

## Structure

```
gamma-spectrum/
├── index.html
├── styles.css
├── main.js      # hero light-streak canvas, colorway → 360° video switch, gallery lightbox, reveal
├── music.js     # original electronic loop (WebAudio) for the hero Sound button
└── assets/
    ├── fonts/   # Jost italic, JetBrains Mono (self-hosted)
    ├── svg/     # Spectrum logo (mark, wordmark, lockup), GAMMA MUSEUM "M", favicon
    ├── video/   # 360° turntables per colorway: .mp4 (H.264) + .webm (VP9) + .jpg poster, 1080×1080, 8 s loops
    └── img/
        ├── hero/      # background-removed side views for the hero (webp + png)
        ├── ampm/ marathon/ synapse/   # gallery JPGs (xx.jpg large, xx-sm.jpg thumb), square crops
        └── og.jpg
```

## Renders used

| Model | Hero | Gallery (in order) | 360° videos |
|---|---|---|---|
| AM/PM | `AMPM (3)` | AMPM (2), ampm (8), AMPM (6), ampm (10), AMPM (1), ampm (9) | AMPM2 (purple), AMPM (white) |
| MARATHON | `marathon (2)` | (3), (9), (1), (5), (10), (4) | MARATHON2 (white), MARATHON (black) |
| SYNAPSE | `synapse (1)` | (3), (10), (2), (4), (7), (9) | SYNAPSE2 (white), SYNAPSE (black) |

## Editing

- Copy and specs live in `index.html`, one `<section class="model">` per shoe.
- When a model goes on sale, change its `Status` value and swap the "Follow the launch" button for a store link.

## Deploy

Same as GAMMA KIDS: Cloudflare Pages project with root directory `Customers/Gabe-Alfortish/gamma-spectrum`,
custom domain `spectrum.gammamuseum.studio`, and a CNAME `spectrum` → `<project>.pages.dev` in the Wix DNS of gammamuseum.studio.
