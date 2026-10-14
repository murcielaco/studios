# GAMMA KIDS — kids.gammamuseum.studio

Client: **Gabe Alfortish** · Brand: **GAMMA MUSEUM** (sub-brand GAMMA KIDS)
Design & development: **MURCIELACO**

Static one-page site (HTML + CSS + JS, no build step). Status: **Coming soon**: the three models are not on sale yet.

## Structure

```
gamma-kids/
├── index.html          # page
├── styles.css          # all styles (palette and fonts at the top)
├── main.js             # gallery, lightbox, scroll reveal, hero parallax
├── netlify.toml        # hosting config (Netlify), optional
└── assets/
    ├── fonts/          # self-hosted Fredoka, Fraunces, Space Grotesk (OFL)
    ├── svg/            # GAMMA wordmark + "M" column logo (from gammamuseum.studio), favicon
    └── img/
        ├── hero/       # background-removed shoes for the blocks (webp + png)
        ├── lambo/      # gallery JPGs (xx.jpg = large, xx-sm.jpg = thumbnail)
        ├── magma/
        ├── squirrels/
        └── og.jpg      # social share image
```

## Models and renders used

| Model | Hero (no background) | Gallery (in order) |
|---|---|---|
| LAMBO | `LAMBO (1)` | LAMBO, (6), (5), (2), (7), (8) |
| MAGMA | `MAGMA (12)` | (14), (1), (10), (11), (15), (9) |
| SQUIRRELS | `SQUIRRELS (2)` | (6), (10), (1), (7), (3), (8) |

Gallery images are JPG, 1800 px max (q90) plus 800 px thumbnails.

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
