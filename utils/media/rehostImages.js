import axios from "axios";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { rawUrl } from "./repoAsset.js";

// Notion serves page images from signed, expiring URLs. Left as-is in the
// published markdown they break once the signature expires, so we re-host them
// in the repo. Already-stable (non-Notion) image URLs are left untouched.
const NOTION_IMAGE_HOST =
  /(amazonaws\.com|notion\.so|notion-static\.com|notionusercontent\.com)/i;
const MD_IMAGE = /!\[([^\]]*)\]\(\s*([^)\s]+)((?:\s+"[^"]*")?)\s*\)/g;

// Pure: the distinct Notion-hosted image URLs referenced in the markdown.
export const collectNotionImageUrls = (markdown) => {
  const urls = [];
  for (const [, , url] of markdown.matchAll(MD_IMAGE)) {
    if (NOTION_IMAGE_HOST.test(url) && !urls.includes(url)) urls.push(url);
  }
  return urls;
};

// Pure: rewrite markdown image URLs using a { originalUrl: newUrl } map. URLs
// absent from the map (or mapped to a falsy value) are left unchanged.
export const rewriteImageUrls = (markdown, urlMap) =>
  markdown.replace(MD_IMAGE, (full, alt, url, title) => {
    const next = urlMap[url];
    return next ? `![${alt}](${next}${title})` : full;
  });

const extFor = (contentType, url) => {
  const fromType = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  }[(contentType || "").split(";")[0].trim()];
  if (fromType) return fromType;
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : "png";
};

// Download each Notion-hosted image, write it under assets/<page>/, and return
// { markdown, relPaths } with the markdown rewritten to repo raw URLs. Files
// are written but NOT committed (the caller batches the commit). Per-image
// best-effort: one that fails to download keeps its original URL.
export const rehostImages = async (pageId, markdown) => {
  const urls = collectNotionImageUrls(markdown);
  if (!urls.length) return { markdown, relPaths: [] };

  const dir = `assets/${pageId.slice(0, 8)}`;
  mkdirSync(dir, { recursive: true });

  const urlMap = {};
  const relPaths = [];
  for (const url of urls) {
    try {
      const resp = await axios.get(url, { responseType: "arraybuffer" });
      const hash = createHash("sha1").update(url).digest("hex").slice(0, 12);
      const relPath = `${dir}/${hash}.${extFor(resp.headers["content-type"], url)}`;
      writeFileSync(relPath, Buffer.from(resp.data));
      urlMap[url] = rawUrl(relPath);
      relPaths.push(relPath);
    } catch {
      // leave this image's original URL in place
    }
  }

  return { markdown: rewriteImageUrls(markdown, urlMap), relPaths };
};
