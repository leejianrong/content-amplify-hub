import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPublishedProperties } from "../utils/success/notion.js";

test("always flips Status to Published", () => {
  const p = buildPublishedProperties("", "");
  assert.deepEqual(p.Status, { select: { name: "Published" } });
});

test("includes URL and stringified article ID when present", () => {
  const p = buildPublishedProperties("https://dev.to/x/y", 4108652);
  assert.deepEqual(p["Dev.to URL"], { url: "https://dev.to/x/y" });
  assert.deepEqual(p["Dev.to Article ID"], {
    rich_text: [{ text: { content: "4108652" } }],
  });
});

test("omits URL / ID properties when empty (avoids clobbering)", () => {
  const p = buildPublishedProperties("", "");
  assert.ok(!("Dev.to URL" in p));
  assert.ok(!("Dev.to Article ID" in p));
});
