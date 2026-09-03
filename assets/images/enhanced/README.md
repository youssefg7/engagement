# Regenerated artwork

18 selected low-resolution artwork groups were regenerated from their original
images, with small detail changes approved by the couple. This covers the opening
florals, Nile and sailboat; invitation flowers; shared floral corners; pink car;
sleeping child; and both dress-code collages. Repeated artwork shares one export.
Other artwork, the couple's photographs, and animated GIFs remain original.

`manifest.json` records each original, its aliases, the generation prompt, and the
selected source PNG. `source/` contains the editable high-resolution outputs;
`web/*-alpha.webp` contains compressed delivery copies with real embedded alpha.
The website never requests `source/` or the legacy `masks/` and non-alpha exports.

The generator sometimes returned painted checkerboards when asked for transparency;
those attempts were rejected. The couple approved standard image processing to
embed real transparency. Native generated alpha is retained where available.
For white-backed florals and clothing, background extraction follows the generated
high-resolution outlines rather than clipping them with mismatched tiny originals.
White connected to the exterior is removed; enclosed white clothing is retained.
Explicit source-pixel seeds handle two enclosed background gaps in the men's row.
Other images retain their original silhouette, baked into the output at build time.
The `alpha`, `fuzz`, and `backgroundSeeds` fields document these choices.

There is no CSS-mask or separate mask-download dependency. Every export is checked
for non-opaque alpha during the build. A missing image falls back to the original.
This is generative restoration, not exact pixel-for-pixel recovery; subtle flower,
clothing and facial details differ. Layouts, fonts, and animations are unchanged.

Rebuild from the repository root (Node.js and ImageMagick required):

```sh
node scripts/build-enhanced-art.mjs
node scripts/link-enhanced-art.mjs
```

The export dimensions preserve the source aspect ratio, normally at 3× resolution
(maximum long edge 2048px). The dress-code collages and new borders use larger,
explicit delivery sizes for high-density displays. Do not regenerate text, the couple's photographs, or
animated GIFs as part of this workflow. Preview both language routes after editing.
