import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { meshSVG } from "./mesh.js";
import { rawUrl } from "../media/repoAsset.js";

export const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cover";

export const renderCoverPng = (title) => {
  const svg = meshSVG(title);
  return new Resvg(svg, { fitTo: { mode: "width", value: 1600 } })
    .render()
    .asPng();
};

// Generate a cover PNG for `title`, write it under covers/, and return
// { relPath, url }. Does NOT commit — the caller batches the commit so a run's
// cover and inline images land in a single push. The filename is derived from
// the title + page ID, so re-runs reuse (and skip re-committing) the same file.
export const generateCover = (pageId, title) => {
  const png = renderCoverPng(title);
  const relPath = `covers/${slugify(title)}-${pageId.slice(0, 8)}.png`;
  mkdirSync("covers", { recursive: true });
  writeFileSync(relPath, png);
  return { relPath, url: rawUrl(relPath) };
};
