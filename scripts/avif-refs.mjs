// Pokreni POSLE što obe Claude Code sesije (03a/03b) završe: node scripts/avif-refs.mjs
// Menja preostale .png reference (ornamenti, leaf3d, logo-wide) u .avif i sklanja PNG originale u _to_delete/.
// public/logos/logo.png i logo-wide.png ostaju kao PNG samo za OG sliku (app/opengraph-image.tsx čita fajl sa diska) i JSON-LD.
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
const files = ["components/sections/Header.tsx","components/sections/Footer.tsx","components/ui/Ornament.tsx","components/ui/SectionTitle.tsx","components/hero/HeroLeaves.tsx"];
const swaps = [
  [/\/images\/ornaments\/leaf-\$\{corner\}\.png/g, "/images/ornaments/leaf-${corner}.avif"],
  [/\/images\/ornaments\/(leaf-(?:tl|tr|bl|br)|leaf3d-[ab])\.png/g, "/images/ornaments/$1.avif"],
  [/"\/logos\/logo-wide\.png"/g, '"/logos/logo-wide.avif"'],
];
let total = 0;
for (const f of files) {
  if (!existsSync(f)) { console.log("skip (nema):", f); continue; }
  let s = readFileSync(f, "utf8"), n = 0;
  for (const [re, to] of swaps) s = s.replace(re, m => (n++, m.replace(re, to)));
  if (n) { writeFileSync(f, s); console.log(`${f}: ${n} zamena`); total += n; }
}
// PNG originali ornamenata → _to_delete (logo PNG-ovi ostaju)
for (const p of ["leaf-tl","leaf-tr","leaf-bl","leaf-br","leaf3d-a","leaf3d-b"]) {
  const src = `public/images/ornaments/${p}.png`;
  if (existsSync(src) && existsSync(`public/images/ornaments/${p}.avif`)) { const dst = join("_to_delete/originals", src); mkdirSync(dirname(dst), { recursive: true }); renameSync(src, dst); console.log("sklonjen", src); }
}
console.log(`Ukupno ${total} zamena. Sada: npx tsc --noEmit && npm run build`);
