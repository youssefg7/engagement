# Engagement invitation

Static, bilingual engagement-invitation website for GitHub Pages.

## Routes

- English: `/`
- Arabic: `/ar/`

Both pages share files from `assets/`. The preserved single-file source remains in `lara_youssef_engagement_v25.html` until the rebuild has been visually compared against it.

## Local preview

From the repository root, run:

```sh
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/` and `http://127.0.0.1:4173/ar/`.

See `IMPLEMENTATION_REFERENCE.md` for the implementation sequence and preservation rules.

## Artwork and loading

Opening artwork loads first; later scenes and maps load as
they approach the viewport. Original animation timings are retained. All font
families are self-hosted with their licenses, with no change to their type roles.

Original image files are preserved. Browser delivery copies can be rebuilt with
`node scripts/optimize-assets.mjs` (requires ImageMagick). See
`assets/images/enhanced/README.md` for the regenerated artwork and its prompts.
The originals also serve as image-error and JavaScript-disabled fallbacks.
Regenerated decorative images contain embedded transparency; no CSS mask is needed.

`scripts/vendor-fonts.mjs` refreshes the existing font download; it requires network
access, but the website itself needs no build system or font CDN.

## RSVP service

The custom bilingual form posts to a small Cloudflare Worker at `worker/`. The Worker authenticates to Google with a private service-account secret and appends responses to the private `RSVP Responses` tab in Google Sheets. See `RSVP_OPERATIONS.md` for deployment and maintenance instructions.
