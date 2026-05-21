import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const htmlPath = path.join(root, "index.html");
const cssPath = path.join(root, "assets/styles.css");
const scriptPath = path.join(root, "assets/script.js");
const sitemapPath = path.join(root, "sitemap.xml");
const robotsPath = path.join(root, "robots.txt");

const read = (filePath) => fs.readFileSync(filePath, "utf8");
const fail = (message) => {
  throw new Error(message);
};

for (const filePath of [htmlPath, cssPath, scriptPath, sitemapPath, robotsPath]) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing required file: ${path.relative(root, filePath)}`);
  }
}

const html = read(htmlPath);
const css = read(cssPath);
const sitemap = read(sitemapPath);
const robots = read(robotsPath);

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
const hashLinks = [...html.matchAll(/\shref="#([^"]+)"/g)].map((match) => match[1]);
const missingAnchors = hashLinks.filter((anchor) => !ids.has(anchor));
if (missingAnchors.length) {
  fail(`Missing anchor targets: ${missingAnchors.join(", ")}`);
}

const localRefs = [
  ...html.matchAll(/\s(?:src|href)="([^"#?]+)(?:\?[^"]*)?"/g),
  ...css.matchAll(/url\(["']?([^)"']+)["']?\)/g)
]
  .map((match) => match[1])
  .filter((ref) => !ref.startsWith("http") && !ref.startsWith("mailto:") && !ref.startsWith("tel:") && !ref.startsWith("#") && !ref.startsWith("data:"));

const missingRefs = localRefs.filter((ref) => !fs.existsSync(path.join(root, ref)));
if (missingRefs.length) {
  fail(`Missing local asset references: ${missingRefs.join(", ")}`);
}

const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
const missingAlt = images.filter((tag) => !/\salt="[^"]+"/.test(tag));
if (missingAlt.length) {
  fail(`Images missing alt text: ${missingAlt.join("\n")}`);
}

const imageSources = [...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map((match) => match[1]);
const imageOutsideAssets = imageSources.filter((src) => !src.startsWith("assets/"));
if (imageOutsideAssets.length) {
  fail(`Images must be in assets/: ${imageOutsideAssets.join(", ")}`);
}

const requiredHeadChecks = [
  ["title", /<title>[^<]+<\/title>/],
  ["meta description", /<meta name="description" content="[^"]+"/],
  ["canonical", /<link rel="canonical" href="https:\/\/www\.islevautoteknik\.dk\/"/],
  ["robots", /<meta name="robots" content="index, follow, max-image-preview:large"/],
  ["Open Graph title", /<meta property="og:title" content="[^"]+"/],
  ["Open Graph image", /<meta property="og:image" content="[^"]+"/],
  ["Twitter card", /<meta name="twitter:card" content="summary_large_image"/],
  ["JSON-LD", /<script type="application\/ld\+json">[\s\S]+?<\/script>/],
  ["viewport", /<meta name="viewport" content="width=device-width, initial-scale=1"/]
];

for (const [label, regex] of requiredHeadChecks) {
  if (!regex.test(html)) {
    fail(`Missing SEO/head tag: ${label}`);
  }
}

const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
JSON.parse(jsonLdMatch[1]);

if ((html.match(/<h1\b/g) || []).length !== 1) {
  fail("Expected exactly one h1.");
}

const externalRequiredLinks = [
  "https://maps.app.goo.gl/VLpR71P9WgLdzp778",
  "https://www.instagram.com/islev_auto_teknik/",
  "https://www.dba.dk/shop/islev-auto-teknik-aps"
];

for (const link of externalRequiredLinks) {
  if (!html.includes(link)) {
    fail(`Missing required external link: ${link}`);
  }
}

if (!sitemap.includes("https://www.islevautoteknik.dk/")) {
  fail("sitemap.xml must include the production URL.");
}

if (!robots.includes("Sitemap: https://www.islevautoteknik.dk/sitemap.xml")) {
  fail("robots.txt must reference the production sitemap.");
}

if (!fs.existsSync(path.join(root, "assets/photos"))) {
  fail("Missing assets/photos directory.");
}

console.log("Site validation passed.");
