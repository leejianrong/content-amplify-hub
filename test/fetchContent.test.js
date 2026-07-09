import { test } from "node:test";
import assert from "node:assert/strict";
import { mapArticle } from "../services/fetchContent.js";

const fullProps = {
  Name: { title: [{ plain_text: "My Title" }] },
  Subtitle: { rich_text: [{ plain_text: "A subtitle" }] },
  "Cover Image": { url: "https://example.com/c.png" },
  "Dev.to Tags": { multi_select: [{ name: "ai" }, { name: "career" }] },
  "Dev.to Article ID": { rich_text: [{ plain_text: "4108652" }] },
};

test("maps every field from a fully-populated page", () => {
  const a = mapArticle(fullProps, "# Body");
  assert.equal(a.title, "My Title");
  assert.equal(a.description, "A subtitle");
  assert.equal(a.main_image, "https://example.com/c.png");
  assert.deepEqual(a.tags, ["ai", "career"]);
  assert.equal(a.existingArticleId, "4108652");
  assert.equal(a.body_markdown, "# Body");
  assert.equal(a.published, true);
});

test("empty rich_text / title arrays fall back to empty strings", () => {
  const a = mapArticle(
    {
      Name: { title: [] },
      Subtitle: { rich_text: [] },
      "Cover Image": { url: null },
      "Dev.to Tags": { multi_select: [] },
      "Dev.to Article ID": { rich_text: [] },
    },
    ""
  );
  assert.equal(a.title, "");
  assert.equal(a.description, "");
  assert.equal(a.main_image, "");
  assert.deepEqual(a.tags, []);
  assert.equal(a.existingArticleId, "");
});

test("missing properties never throw and yield safe defaults", () => {
  const a = mapArticle({ Name: { title: [{ plain_text: "T" }] } }, "b");
  assert.equal(a.title, "T");
  assert.equal(a.main_image, "");
  assert.equal(a.existingArticleId, "");
  assert.deepEqual(a.tags, []);
});
