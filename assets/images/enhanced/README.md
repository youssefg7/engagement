# Regenerated artwork

16 selected low-resolution artwork groups were regenerated from their original
images, with small detail changes approved by the couple. This covers the opening
florals, Nile and sailboat; invitation flowers; shared floral corners; pink car;
sleeping child; and both dress-code collages. Repeated artwork shares one export.
Other artwork, the couple's photographs, and animated GIFs remain original.

`manifest.json` records each original, its aliases, the generation prompt, and the
selected source PNG. `source/` contains the editable high-resolution outputs;
`web/` contains compressed delivery copies. The website never requests `source/`.

The generator returned painted checkerboards when asked for transparency. Those
attempts were rejected. The selected outputs use white backgrounds, with the
original alpha silhouettes applied through compact `masks/` files. Masks and
images are decoded before scene animations begin. A missing image or mask falls
back to the unmodified original. This is generative restoration, not exact
pixel-for-pixel recovery; subtle flower, clothing and facial details differ.

Rebuild from the repository root (Node.js and ImageMagick required):

```sh
node scripts/build-enhanced-art.mjs
node scripts/link-enhanced-art.mjs
```

The export dimensions preserve the source aspect ratio, normally at 3× resolution
(maximum long edge 2048px). Do not regenerate text, the couple's photographs, or
animated GIFs as part of this workflow. Preview both language routes after editing.
