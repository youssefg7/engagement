# Code-only original-art refinement

These files are derived directly from the original PNGs, with no image generation,
AI upscaler, content replacement, background removal, recoloring, or redrawing.

The reproducible pipeline uses 2× Mitchell resampling and gentle RGB-only unsharp
masking (`0x0.65+0.4+0.025`). Alpha is resampled with the image but never sharpened;
WebP stores alpha losslessly. A check of all 43 outputs confirmed alpha is identical
to the same resize without sharpening. This smooths rendering and adds modest edge
definition; it does not recover absent detail or turn tiny originals into true HD.

`manifest.json` records exact input/output paths, dimensions, quality and sizes.
Color quality starts at 94, with 90/86 available to enforce a per-file size budget
of 1.8× the native optimized copy (16 KB minimum). Oversized candidates are skipped.
Native originals remain the 1× source; browsers can choose the refined 2× source
on high-density displays. Offscreen `srcset` values are deferred with the image.
Photos, paper, the seal, line-art text substitutes and GIF animations are untouched.

From the repository root:

```sh
node scripts/refine-original-art.mjs
node scripts/link-original-art.mjs
```

The script's `settings` object is the place to adjust processing strength. Inspect
both routes after changing it. To switch back to native originals without deleting
any images:

```sh
node scripts/link-original-art.mjs --original-only
```
