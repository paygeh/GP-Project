// Remove a solid white background by flood-filling from the image borders,
// preserving interior whites (chrome text, diamonds, sparkle highlights).
// Usage: node scripts/remove-bg.cjs <input> <output> [floodThresh] [featherLo]
const sharp = require("sharp");

const input = process.argv[2];
const output = process.argv[3];
const FLOOD = Number(process.argv[4] ?? 230); // min channel to treat as bg
const FEATHER_LO = Number(process.argv[5] ?? 205); // feather edge from here..255

(async () => {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels === 4
  const n = width * height;
  const bg = new Uint8Array(n);
  const stack = [];

  const isLight = (p, thr) => {
    const i = p * channels;
    return data[i] >= thr && data[i + 1] >= thr && data[i + 2] >= thr;
  };
  const seed = (x, y) => {
    const p = y * width + x;
    if (!bg[p] && isLight(p, FLOOD)) {
      bg[p] = 1;
      stack.push(p);
    }
  };

  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) seed(x - 1, y);
    if (x < width - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < height - 1) seed(x, y + 1);
  }

  let cleared = 0;
  for (let p = 0; p < n; p++) {
    if (bg[p]) {
      data[p * channels + 3] = 0;
      cleared++;
    }
  }

  // Feather the 1px fringe: light pixels bordering transparency fade out so
  // there's no hard white ring on dark backgrounds.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (bg[p]) continue;
      const adj =
        (x > 0 && bg[p - 1]) ||
        (x < width - 1 && bg[p + 1]) ||
        (y > 0 && bg[p - width]) ||
        (y < height - 1 && bg[p + width]);
      if (!adj) continue;
      const i = p * channels;
      const m = Math.min(data[i], data[i + 1], data[i + 2]);
      if (m > FEATHER_LO) {
        const a = Math.round((255 * (255 - m)) / (255 - FEATHER_LO));
        data[i + 3] = Math.min(data[i + 3], Math.max(0, a));
      }
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .trim()
    .toFile(output);

  const pct = ((cleared / n) * 100).toFixed(1);
  console.log(`Input ${width}x${height}. Cleared ${pct}% as background.`);
  const meta = await sharp(output).metadata();
  console.log(`Output ${meta.width}x${meta.height} (trimmed), hasAlpha=${meta.hasAlpha}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
