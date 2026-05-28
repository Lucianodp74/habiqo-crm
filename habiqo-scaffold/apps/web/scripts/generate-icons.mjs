import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MASTER = readFileSync(join(ROOT, "public/brand/icon-master.svg"));
const MASKABLE = readFileSync(join(ROOT, "public/brand/icon-maskable.svg"));
const OUT = join(ROOT, "public");

mkdirSync(OUT, { recursive: true });

const targets = [
  { src: MASTER, name: "icon-192.png", size: 192 },
  { src: MASTER, name: "icon-512.png", size: 512 },
  { src: MASTER, name: "apple-icon.png", size: 180 },
  { src: MASKABLE, name: "icon-maskable-512.png", size: 512 },
  { src: MASTER, name: "favicon-32.png", size: 32 },
];

for (const t of targets) {
  await sharp(t.src)
    .resize(t.size, t.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(OUT, t.name));
  console.log("✓", t.name, t.size + "×" + t.size);
}

console.log("\nNext: cd apps/web && npx png-to-ico public/favicon-32.png > public/favicon.ico");
