import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(projectRoot, "lara_youssef_engagement_v25.html");
const imagesRoot = join(projectRoot, "assets", "images");
const manifestPath = join(imagesRoot, "manifest.json");
const csvPath = join(imagesRoot, "elements.csv");
const readmePath = join(imagesRoot, "README.md");

const scenes = [
  { index: 0, slug: "opening", label: "Opening" },
  { index: 1, slug: "invitation", label: "Invitation" },
  { index: 2, slug: "celebration", label: "Celebration" },
  { index: 3, slug: "date", label: "Date" },
  { index: 4, slug: "ceremony", label: "Ceremony" },
  { index: 5, slug: "reception-boat", label: "Reception by boat" },
  { index: 6, slug: "reception-car", label: "Reception by car" },
  { index: 7, slug: "dress-code", label: "Dress code" },
  { index: 8, slug: "rsvp", label: "RSVP" },
];

const sceneByIndex = new Map(scenes.map((scene) => [scene.index, scene]));

// Overrides are intentionally kept beside the extractor so asset decisions are
// reviewable and reproducible. Keys use "scene-index:data-root". Elements
// without a data-root can instead use "scene-index:class:<class-name>".
const overrides = new Map([
  // Opening
  ["0:2", { classification: "decorative-artwork", label: "top-floral-garland" }],
  ["0:3", { classification: "decorative-artwork", label: "pink-oval-frame" }],
  ["0:4", { classification: "text-fragment", label: "lara-name-artwork" }],
  ["0:5", { classification: "text-fragment", label: "engaged-strapline" }],
  ["0:6", { classification: "decorative-artwork", label: "watercolor-heart" }],
  ["0:7", { classification: "text-fragment", label: "ampersand-artwork" }],
  ["0:8", { classification: "decorative-artwork", label: "heart-divider" }],
  ["0:9", { classification: "decorative-artwork", label: "bottom-left-floral-spray" }],
  ["0:10", { classification: "meaningful-artwork", label: "nile-watercolor" }],
  ["0:11", { classification: "decorative-artwork", label: "left-floral-border" }],
  ["0:12", { classification: "text-fragment", label: "youssef-name-artwork" }],
  ["0:13", { classification: "decorative-artwork", label: "right-floral-border" }],
  ["0:20", { classification: "meaningful-artwork", label: "sailboat" }],
  ["0:class:correct-bird", { classification: "decorative-artwork", label: "hummingbird" }],

  // Invitation
  ["1:23", { classification: "decorative-artwork", label: "top-right-floral-corner" }],
  ["1:24", { classification: "decorative-artwork", label: "left-floral-corner" }],
  ["1:25", { classification: "decorative-artwork", label: "upper-floral-spray" }],
  ["1:26", { classification: "decorative-artwork", label: "center-floral-spray" }],
  ["1:27", { classification: "decorative-artwork", label: "open-envelope-back" }],
  ["1:28", { classification: "decorative-artwork", label: "left-photo-backing" }],
  ["1:29", { classification: "meaningful-artwork", label: "couple-photo-stairs" }],
  ["1:30", { classification: "decorative-artwork", label: "right-photo-backing" }],
  ["1:31", { classification: "decorative-artwork", label: "right-photo-overlay" }],
  ["1:32", { classification: "decorative-artwork", label: "invitation-card-pink-fill" }],
  ["1:33", { classification: "decorative-artwork", label: "invitation-card-lace-frame" }],
  ["1:34", { classification: "decorative-artwork", label: "open-envelope-front" }],
  ["1:39", { classification: "meaningful-artwork", label: "couple-polaroid" }],
  ["1:40", { classification: "decorative-artwork", label: "calla-lilies" }],
  ["1:41", { classification: "decorative-artwork", label: "hanging-amaranthus" }],
  ["1:42", { classification: "decorative-artwork", label: "bouquet" }],
  ["1:class:actual-envelope-paper", { classification: "decorative-artwork", label: "closed-envelope-paper" }],
  ["1:class:actual-envelope-text", { classification: "text-fragment", label: "youre-invited-lettering" }],
  ["1:class:actual-envelope-seal", { classification: "decorative-artwork", label: "wax-seal" }],
  ["1:class:exact-orange-title", { classification: "text-fragment", label: "orange-couple-title" }],

  // Celebration
  ["2:60", { classification: "decorative-artwork", label: "top-right-floral-corner" }],
  ["2:61", { classification: "decorative-artwork", label: "right-floral-spray" }],
  ["2:62", { classification: "decorative-artwork", label: "left-floral-corner" }],
  ["2:63", { classification: "decorative-artwork", label: "left-floral-spray" }],
  ["2:64", { classification: "text-fragment", label: "adults-only-intro-line" }],
  ["2:65", { classification: "text-fragment", label: "celebration-heading-t" }],
  ["2:69", { classification: "text-fragment", label: "section-heading-c" }],
  ["2:137", { classification: "meaningful-artwork", label: "sleeping-child" }],

  // Date
  ["3:139", { classification: "decorative-artwork", label: "left-floral-corner" }],
  ["3:140", { classification: "decorative-artwork", label: "upper-left-floral-spray" }],
  ["3:141", { classification: "decorative-artwork", label: "upper-right-floral-spray" }],
  ["3:181", { classification: "decorative-artwork", label: "right-floral-corner" }],
  ["3:208", { classification: "text-fragment", label: "date-heading-d" }],

  // Ceremony
  ["4:214", { classification: "meaningful-artwork", label: "church-map-snapshot" }],
  ["4:258", { classification: "decorative-artwork", label: "left-floral-corner" }],
  ["4:259", { classification: "decorative-artwork", label: "right-floral-corner" }],
  ["4:260", { classification: "decorative-artwork", label: "lower-left-floral-spray" }],
  ["4:261", { classification: "decorative-artwork", label: "right-floral-spray" }],
  ["4:263", { classification: "text-fragment", label: "section-heading-c" }],

  // Reception by boat
  ["5:275", { classification: "meaningful-artwork", label: "boat-map-snapshot" }],
  ["5:345", { classification: "meaningful-artwork", label: "sailboat" }],
  ["5:346", { classification: "decorative-artwork", label: "top-right-floral-corner" }],
  ["5:347", { classification: "meaningful-artwork", label: "nile-watercolor" }],
  ["5:348", { classification: "decorative-artwork", label: "left-floral-border" }],
  ["5:349", { classification: "text-fragment", label: "reception-heading-r" }],

  // Reception by car
  ["6:379", { classification: "meaningful-artwork", label: "car-map-snapshot" }],
  ["6:380", { classification: "decorative-artwork", label: "upper-left-floral-spray" }],
  ["6:449", { classification: "decorative-artwork", label: "top-right-floral-corner" }],
  ["6:450", { classification: "decorative-artwork", label: "right-floral-border" }],
  ["6:495", { classification: "meaningful-artwork", label: "pink-car" }],
  ["6:516", { classification: "text-fragment", label: "reception-heading-r" }],

  // Dress code
  ["7:526", { classification: "decorative-artwork", label: "upper-left-floral-spray" }],
  ["7:527", { classification: "decorative-artwork", label: "top-right-floral-corner" }],
  ["7:528", { classification: "decorative-artwork", label: "right-floral-border" }],
  ["7:529", { classification: "meaningful-artwork", label: "womens-dress-examples" }],
  ["7:530", { classification: "meaningful-artwork", label: "mens-suit-examples" }],
  ["7:548", { classification: "text-fragment", label: "dress-heading-d" }],
  ["7:554", { classification: "text-fragment", label: "code-heading-c" }],

  // RSVP
  ["8:559", { classification: "decorative-artwork", label: "left-floral-corner" }],
  ["8:560", { classification: "decorative-artwork", label: "right-floral-corner" }],
  ["8:561", { classification: "decorative-artwork", label: "right-floral-spray" }],
  ["8:562", { classification: "decorative-artwork", label: "upper-left-floral-spray" }],
  ["8:563", { classification: "decorative-artwork", label: "rsvp-card-background" }],
  ["8:564", { classification: "decorative-artwork", label: "rsvp-lace-frame" }],
  ["8:581", { classification: "text-fragment", label: "rsvp-heading-r" }],
  ["8:585", { classification: "text-fragment", label: "rsvp-heading-s" }],
  ["8:587", { classification: "text-fragment", label: "rsvp-heading-v" }],
  ["8:588", { classification: "text-fragment", label: "rsvp-heading-p" }],
  ["8:589", { classification: "text-fragment", label: "rsvp-handwritten-note" }],
]);

const obsoleteRoots = new Set(["1:36", "1:43", "1:44", "1:45"]);
const obsoleteClasses = new Set(["closed-envelope-ref", "wax-seal-ref"]);

function parseAttributes(tag) {
  const attributes = {};
  const expression = /([\w:-]+)(?:="([^"]*)")?/g;
  let match;

  // Skip the element name, which is the first expression match.
  expression.exec(tag);
  while ((match = expression.exec(tag))) {
    attributes[match[1]] = match[2] ?? "";
  }

  return attributes;
}

function parseStyle(style = "") {
  return Object.fromEntries(
    style
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(":");
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

function decodeDataUri(uri) {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]+)$/.exec(uri);
  if (!match) throw new Error("Unsupported or missing image data URI");

  return {
    mimeType: match[1],
    bytes: match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf8"),
  };
}

function extensionFor(mimeType) {
  return {
    "image/gif": "gif",
    "image/png": "png",
    "image/svg+xml": "svg",
  }[mimeType];
}

function intrinsicSize(bytes, mimeType) {
  if (mimeType === "image/png" && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }

  if (mimeType === "image/gif" && bytes.length >= 10) {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8) };
  }

  if (mimeType === "image/svg+xml") {
    const svg = bytes.toString("utf8");
    const width = /\bwidth="([\d.]+)/.exec(svg)?.[1];
    const height = /\bheight="([\d.]+)/.exec(svg)?.[1];
    const viewBox = /\bviewBox="[^\s"]+\s+[^\s"]+\s+([\d.]+)\s+([\d.]+)"/.exec(svg);
    return {
      width: Number(width ?? viewBox?.[1] ?? 0),
      height: Number(height ?? viewBox?.[2] ?? 0),
    };
  }

  return { width: 0, height: 0 };
}

function overrideKey(element) {
  if (element.dataRoot) return `${element.sceneIndex}:${element.dataRoot}`;

  const matchingClass = element.classes.find((className) =>
    overrides.has(`${element.sceneIndex}:class:${className}`),
  );
  return matchingClass ? `${element.sceneIndex}:class:${matchingClass}` : null;
}

function fallbackContentClassification(element) {
  const key = `${element.sceneIndex}:${element.dataRoot ?? ""}`;
  if (
    obsoleteRoots.has(key) ||
    element.classes.some((className) => obsoleteClasses.has(className))
  ) {
    return "obsolete-layer";
  }

  // Canva exported most copy after the invitation as small individual glyph
  // images. The 6% scene-height cutoff catches those fragments; larger copy
  // groups and semantic artwork are handled by explicit overrides.
  if (
    element.sceneIndex >= 2 &&
    Number.isFinite(element.rendered.heightPercent) &&
    element.rendered.heightPercent < 6
  ) {
    return "text-fragment";
  }

  return "decorative-artwork";
}

function cleanName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function removePreviousGeneratedAssets() {
  if (!existsSync(manifestPath)) return;

  const previous = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const asset of previous.assets ?? []) {
    if (
      typeof asset.path !== "string" ||
      !asset.path.startsWith("assets/images/") ||
      !/\.(gif|png|svg)$/.test(asset.path)
    ) {
      throw new Error(`Refusing to remove unexpected generated path: ${asset.path}`);
    }

    const absolutePath = join(projectRoot, asset.path);
    if (existsSync(absolutePath)) unlinkSync(absolutePath);
  }
}

const source = readFileSync(sourcePath, "utf8");
const sourceSha256 = createHash("sha256").update(source).digest("hex");
const elements = [];
let activeScene = null;

for (const match of source.matchAll(/<section\b[^>]*>|<\/section>|<img\b[^>]*>/g)) {
  const tag = match[0];

  if (tag.startsWith("<section")) {
    const attributes = parseAttributes(tag);
    const sceneMatch = attributes.class?.match(/\bscene-(\d+)\b/);
    activeScene = sceneMatch ? Number(sceneMatch[1]) : null;
    continue;
  }

  if (tag.startsWith("</section")) {
    activeScene = null;
    continue;
  }

  if (activeScene == null) continue;

  const attributes = parseAttributes(tag);
  const { bytes, mimeType } = decodeDataUri(attributes.src);
  const style = parseStyle(attributes.style);
  const scene = sceneByIndex.get(activeScene);
  const classes = (attributes.class ?? "").split(/\s+/).filter(Boolean);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const sceneOrder = elements.filter((item) => item.sceneIndex === activeScene).length + 1;
  const rendered = {
    leftPercent: Number.parseFloat(style.left),
    topPercent: Number.parseFloat(style.top),
    widthPercent: Number.parseFloat(style.width),
    heightPercent: Number.parseFloat(style.height),
  };
  const element = {
    id: `${scene.slug}-image-${String(sceneOrder).padStart(3, "0")}`,
    sourceOrder: elements.length + 1,
    sceneIndex: scene.index,
    scene: scene.slug,
    sceneOrder,
    dataRoot: attributes["data-root"] ?? null,
    classes,
    alt: attributes.alt ?? null,
    mimeType,
    extension: extensionFor(mimeType),
    bytes,
    byteLength: bytes.length,
    payloadSha256: hash,
    intrinsic: intrinsicSize(bytes, mimeType),
    rendered,
  };
  const manual = overrides.get(overrideKey(element));
  element.contentClassification =
    manual?.classification ?? fallbackContentClassification(element);
  element.label = manual?.label ?? null;
  elements.push(element);
}

if (elements.length !== 614) {
  throw new Error(`Expected 614 image elements, found ${elements.length}`);
}

const payloadGroups = new Map();
for (const element of elements) {
  const group = payloadGroups.get(element.payloadSha256) ?? [];
  group.push(element);
  payloadGroups.set(element.payloadSha256, group);
}

removePreviousGeneratedAssets();
mkdirSync(imagesRoot, { recursive: true });
mkdirSync(join(imagesRoot, "shared"), { recursive: true });

const assets = [];
for (const [payloadSha256, uses] of payloadGroups) {
  const canonical =
    uses.find((use) => use.contentClassification !== "obsolete-layer") ?? uses[0];
  const usedScenes = [...new Set(uses.map((use) => use.scene))];
  const folder = usedScenes.length > 1 ? "shared" : canonical.scene;
  const contentClassification = canonical.contentClassification;
  const rootPart = canonical.dataRoot
    ? `root-${cleanName(canonical.dataRoot)}`
    : `item-${String(canonical.sceneOrder).padStart(3, "0")}`;
  const label = cleanName(canonical.label ?? `${contentClassification}-${rootPart}`);
  const filename = `${label}-${payloadSha256.slice(0, 8)}.${canonical.extension}`;
  const projectPath = `assets/images/${folder}/${filename}`;
  const absolutePath = join(projectRoot, projectPath);

  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, canonical.bytes);

  const asset = {
    id: `asset-${payloadSha256.slice(0, 12)}`,
    path: projectPath,
    mimeType: canonical.mimeType,
    byteLength: canonical.byteLength,
    sha256: payloadSha256,
    intrinsic: canonical.intrinsic,
    contentClassification,
    label: canonical.label,
    usageCount: uses.length,
    scenes: usedScenes,
    canonicalElementId: canonical.id,
  };
  assets.push(asset);

  for (const use of uses) {
    use.assetId = asset.id;
    use.assetPath = asset.path;
    use.canonicalElementId = canonical.id;
    use.isRepeatedPayload = use !== canonical;
    use.classification =
      use.contentClassification === "obsolete-layer"
        ? "obsolete-layer"
        : use.isRepeatedPayload
          ? "repeated-payload"
          : use.contentClassification;
  }
}

assets.sort((a, b) => a.path.localeCompare(b.path));

const classificationNames = [
  "text-fragment",
  "meaningful-artwork",
  "decorative-artwork",
  "repeated-payload",
  "obsolete-layer",
];

const classificationCounts = Object.fromEntries(
  classificationNames.map((classification) => [
    classification,
    elements.filter((element) => element.classification === classification).length,
  ]),
);

const contentClassificationCounts = Object.fromEntries(
  classificationNames
    .filter((classification) => classification !== "repeated-payload")
    .map((classification) => [
      classification,
      elements.filter(
        (element) => element.contentClassification === classification,
      ).length,
    ]),
);

const sceneSummary = scenes.map((scene) => {
  const sceneElements = elements.filter((element) => element.sceneIndex === scene.index);
  return {
    ...scene,
    elementCount: sceneElements.length,
    uniquePayloadCount: new Set(sceneElements.map((element) => element.payloadSha256)).size,
    textFragmentCount: sceneElements.filter(
      (element) => element.contentClassification === "text-fragment",
    ).length,
    meaningfulArtworkCount: sceneElements.filter(
      (element) => element.contentClassification === "meaningful-artwork",
    ).length,
    decorativeArtworkCount: sceneElements.filter(
      (element) => element.contentClassification === "decorative-artwork",
    ).length,
    repeatedPayloadCount: sceneElements.filter((element) => element.isRepeatedPayload).length,
    obsoleteLayerCount: sceneElements.filter(
      (element) => element.contentClassification === "obsolete-layer",
    ).length,
  };
});

const publicElements = elements.map(({ bytes, extension, ...element }) => element);
const manifest = {
  schemaVersion: 1,
  source: {
    path: relative(projectRoot, sourcePath),
    sha256: sourceSha256,
  },
  summary: {
    imageElementCount: elements.length,
    uniquePayloadCount: assets.length,
    duplicateReferenceCount: elements.length - assets.length,
    classificationCounts,
    contentClassificationCounts,
    scenes: sceneSummary,
  },
  assets,
  elements: publicElements,
};

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const csvHeaders = [
  "id",
  "sourceOrder",
  "scene",
  "sceneOrder",
  "dataRoot",
  "classification",
  "contentClassification",
  "isRepeatedPayload",
  "assetPath",
  "canonicalElementId",
  "payloadSha256",
  "intrinsicWidth",
  "intrinsicHeight",
  "leftPercent",
  "topPercent",
  "widthPercent",
  "heightPercent",
  "classes",
];
const csvRows = publicElements.map((element) => [
  element.id,
  element.sourceOrder,
  element.scene,
  element.sceneOrder,
  element.dataRoot,
  element.classification,
  element.contentClassification,
  element.isRepeatedPayload,
  element.assetPath,
  element.canonicalElementId,
  element.payloadSha256,
  element.intrinsic.width,
  element.intrinsic.height,
  element.rendered.leftPercent,
  element.rendered.topPercent,
  element.rendered.widthPercent,
  element.rendered.heightPercent,
  element.classes.join(" "),
]);
writeFileSync(
  csvPath,
  `${[csvHeaders, ...csvRows].map((row) => row.map(csvCell).join(",")).join("\n")}\n`,
);

const sceneTable = sceneSummary
  .map(
    (scene) =>
      `| ${scene.index + 1} | ${scene.label} | ${scene.elementCount} | ${scene.uniquePayloadCount} | ${scene.textFragmentCount} | ${scene.meaningfulArtworkCount} | ${scene.decorativeArtworkCount} | ${scene.repeatedPayloadCount} | ${scene.obsoleteLayerCount} |`,
  )
  .join("\n");

const readme = `# Extracted image assets

Generated by \`node scripts/extract-assets.mjs\` from the preserved single-file source.

The extractor decodes every embedded image, hashes the decoded bytes, and writes one physical file per unique payload. Reused payloads point to the same file in \`manifest.json\` and \`elements.csv\`. Files used across multiple scenes live in \`shared/\`; scene-specific files stay in their scene folder.

## Current inventory

- Image elements: ${elements.length}
- Unique physical files: ${assets.length}
- Duplicate references removed at the file level: ${elements.length - assets.length}
- PNG references: ${elements.filter((element) => element.mimeType === "image/png").length}
- GIF references: ${elements.filter((element) => element.mimeType === "image/gif").length}
- SVG references: ${elements.filter((element) => element.mimeType === "image/svg+xml").length}

| # | Scene | Elements | Unique payloads | Text fragments | Meaningful artwork | Decorative artwork | Repeated payloads | Obsolete layers |
|---:|---|---:|---:|---:|---:|---:|---:|---:|
${sceneTable}

## Classification fields

- \`classification\` is the Task 3 primary category. A later use of an existing payload is \`repeated-payload\`; a CSS-disabled legacy layer remains \`obsolete-layer\`.
- \`contentClassification\` records what the image contains even when its primary category is \`repeated-payload\`.
- \`assetPath\` is the one canonical physical file used by that element.
- \`canonicalElementId\` identifies the source occurrence selected for that file.

Text fragments are intentionally retained as extracted evidence. They must not be deleted until Tasks 4–5 provide and visually verify their live-text replacements. Obsolete layers are documented but should not be used by the rebuild.

The final source CSS still contains selectors for older hidden envelope and invitation-text layers, but those matching image elements are no longer present in the current markup. Therefore the current obsolete-layer count is zero; the extractor retains support for that classification if such a layer is encountered later.
`;
writeFileSync(readmePath, readme);

console.log(
  JSON.stringify(
    {
      sourceSha256,
      imageElements: elements.length,
      uniqueAssets: assets.length,
      duplicateReferences: elements.length - assets.length,
      classificationCounts,
      contentClassificationCounts,
    },
    null,
    2,
  ),
);
