import { test } from "node:test";
import assert from "node:assert/strict";
import {
  collectNotionImageUrls,
  rewriteImageUrls,
} from "../utils/media/rehostImages.js";

const s3 =
  "https://prod-files-secure.s3.us-west-2.amazonaws.com/x/y.png?sig=1";
const md = [
  "intro",
  `![a](${s3})`,
  "![b](https://example.com/keep.png)",
  '![c](https://www.notion.so/image/abc "cap")',
].join("\n\n");

test("collects only Notion-hosted image URLs", () => {
  const urls = collectNotionImageUrls(md);
  assert.equal(urls.length, 2);
  assert.ok(urls.includes(s3));
  assert.ok(urls.some((u) => u.includes("notion.so")));
  assert.ok(!urls.some((u) => u.includes("example.com")));
});

test("rewrites only mapped URLs, preserving alt and non-Notion images", () => {
  const out = rewriteImageUrls(md, { [s3]: "https://raw/host/y.png" });
  assert.ok(out.includes("![a](https://raw/host/y.png)"));
  assert.ok(out.includes("![b](https://example.com/keep.png)"));
});

test("preserves the markdown image title on untouched images", () => {
  const out = rewriteImageUrls(md, { [s3]: "https://raw/host/y.png" });
  assert.ok(out.includes('"cap"'));
});

test("dedupes repeated URLs", () => {
  const dup =
    "![](https://notion.so/image/z)\n\n![](https://notion.so/image/z)";
  assert.deepEqual(collectNotionImageUrls(dup), ["https://notion.so/image/z"]);
});
