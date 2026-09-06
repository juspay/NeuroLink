#!/usr/bin/env node
/**
 * Regenerates test/fixtures/transactions-screenshot.png from transactions.csv.
 *
 * The fixture renders the SAME rows the CSV holds, because the suite case
 * that uses it ("CLI Stream CSV and Screenshot") asks a vision model to
 * compare the two and answer whether they are the same data. That case used
 * to point at `sample-screenshot.png`, a 100x100 solid blue square with no
 * content, so the model correctly refused to compare and the case failed on
 * the model being right.
 *
 * This is a SEPARATE file on purpose. `sample-screenshot.png` is shared by
 * seven call sites, and `continuous-test-suite-provider-matrix.ts` depends on
 * it being solid blue: its "vision describes an image" case asks for the
 * dominant colour and asserts /blue/i, which is the canary for a model that
 * never received the image at all. Overwriting it would have silently broken
 * every vision cell in the matrix. Keep this image and the CSV in sync.
 *
 * Run: node test/fixtures/generate-sample-screenshot.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
// `sharp` is an optionalDependency, so a fresh checkout that skipped optional
// installs will not have it. Fail with something a reader can act on.
let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "sharp is not installed — it is an optionalDependency. Run `pnpm install` " +
      "with optional dependencies enabled to regenerate this fixture.",
  );
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, "transactions.csv"), "utf8").trim();
// `split(",")` silently shifts every column if a field is ever quoted, and
// the image would then stop matching the CSV it is supposed to mirror —
// without failing, which is the bad kind of wrong for a fixture a vision
// model is asked to compare. Refuse rather than mis-render.
if (raw.includes('"')) {
  console.error(
    "transactions.csv contains a quoted field. This generator splits on commas " +
      "and would shift columns. Add quoted-field parsing before regenerating.",
  );
  process.exit(1);
}
const rows = raw.split("\n").map((line) => line.split(","));
const [header, ...body] = rows;

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const COL_X = [40, 200, 330, 460, 610];
const ROW_H = 34;
const TOP = 148;
const W = 980;
const H = TOP + (body.length + 1) * ROW_H + 40;

const cell = (text, x, y, opts = {}) =>
  `<text x="${x}" y="${y}" font-family="DejaVu Sans Mono, Menlo, monospace" font-size="${opts.size ?? 17}" fill="${opts.fill ?? "#1a1a1a"}" font-weight="${opts.weight ?? "normal"}">${esc(text)}</text>`;

const headerCells = header
  .map((h, i) =>
    cell(h, COL_X[i], TOP - 12, { weight: "bold", fill: "#0b3d6b" }),
  )
  .join("");

const bodyRows = body
  .map((r, ri) => {
    const y = TOP + (ri + 1) * ROW_H - 12;
    const band =
      ri % 2 === 1
        ? `<rect x="24" y="${y - 22}" width="${W - 48}" height="${ROW_H}" fill="#f4f7fb"/>`
        : "";
    return band + r.map((c, ci) => cell(c, COL_X[ci], y)).join("");
  })
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="72" fill="#0b3d6b"/>
  <text x="32" y="46" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#ffffff" font-weight="bold">Transactions Dashboard</text>
  <text x="32" y="98" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#444444">Settlement report — ${body.length} transactions</text>
  ${headerCells}
  <line x1="24" y1="${TOP - 4}" x2="${W - 24}" y2="${TOP - 4}" stroke="#0b3d6b" stroke-width="2"/>
  ${bodyRows}
</svg>`;

const out = join(here, "transactions-screenshot.png");
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`wrote ${out} (${W}x${H}, ${body.length} rows)`);
