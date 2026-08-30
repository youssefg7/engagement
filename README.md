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
