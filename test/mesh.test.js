import { test } from "node:test";
import assert from "node:assert/strict";
import { meshSVG, paletteForTitle, PALETTES } from "../utils/cover/mesh.js";
import { slugify } from "../utils/cover/hostCover.js";

test("meshSVG is deterministic for the same title", () => {
  assert.equal(meshSVG("Hello World!"), meshSVG("Hello World!"));
});

test("meshSVG differs across titles", () => {
  assert.notEqual(meshSVG("Hello World!"), meshSVG("Something Else"));
});

test("meshSVG returns a 1600x840 svg document", () => {
  const svg = meshSVG("Idempotent APIs");
  assert.match(svg, /^<svg[^>]*viewBox="0 0 1600 840"/);
  assert.match(svg, /<\/svg>$/);
});

test("paletteForTitle is stable and returns a known palette", () => {
  const p = paletteForTitle("Hello World!");
  assert.equal(p, paletteForTitle("Hello World!"));
  assert.ok(Object.keys(PALETTES).includes(p));
});

test("slugify lowercases, collapses punctuation, trims dashes", () => {
  assert.equal(slugify("Hello World!"), "hello-world");
  assert.equal(slugify("  A/B: C  "), "a-b-c");
});

test("slugify falls back to 'cover' for punctuation-only input", () => {
  assert.equal(slugify("!!!"), "cover");
});
