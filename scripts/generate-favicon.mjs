import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svgPath = path.join(root, "src/app/icon.svg");
const outPath = path.join(root, "src/app/favicon.ico");

const svg = await fs.readFile(svgPath);
const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);
const ico = await toIco(pngs);

await fs.writeFile(outPath, ico);
console.log(`Wrote ${outPath} (${ico.length} bytes)`);
