import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { meshSVG } from "./mesh.js";

// GitHub Actions provides these automatically. BRANCH is where covers are
// committed and from which the public raw URL is served.
const REPO_SLUG = process.env.GITHUB_REPOSITORY; // "owner/repo"
const BRANCH = process.env.COVERS_BRANCH || "main";

const slugify = (title) =>
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

// Generate a cover PNG for `title`, commit it to covers/ on BRANCH, push, and
// return the public raw URL. The filename is derived from the title + page ID,
// so re-runs of the same page reuse (and, if unchanged, skip re-committing) the
// same file. Throws on failure — callers should treat a cover as best-effort.
export const generateAndHostCover = async (pageId, title) => {
  const png = renderCoverPng(title);
  const relPath = `covers/${slugify(title)}-${pageId.slice(0, 8)}.png`;

  mkdirSync("covers", { recursive: true });
  writeFileSync(relPath, png);

  const git = (...args) => execFileSync("git", args, { stdio: "pipe" });
  git("config", "user.name", "github-actions[bot]");
  git(
    "config",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com"
  );
  git("add", relPath);

  // If a prior run already committed this exact cover, there's nothing to do.
  const pending = git("status", "--porcelain", relPath).toString().trim();
  if (pending) {
    git("commit", "-m", `chore(covers): cover for "${title}"`);
    // Reduce the chance of a non-fast-forward push on an active branch.
    git("pull", "--rebase", "--autostash", "origin", BRANCH);
    git("push", "origin", `HEAD:${BRANCH}`);
  }

  const [owner, repo] = (REPO_SLUG || "/").split("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${BRANCH}/${relPath}`;
};
