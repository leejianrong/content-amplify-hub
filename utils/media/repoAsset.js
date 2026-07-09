import { execFileSync } from "node:child_process";

// GitHub Actions provides GITHUB_REPOSITORY automatically. BRANCH is where
// assets are committed and from which the public raw URL is served.
const REPO_SLUG = process.env.GITHUB_REPOSITORY; // "owner/repo"
const BRANCH = process.env.COVERS_BRANCH || "main";

export const rawUrl = (relPath) => {
  const [owner, repo] = (REPO_SLUG || "/").split("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${BRANCH}/${relPath}`;
};

// Commit the given repo-relative paths and push to BRANCH. No-ops when none of
// the paths actually changed, so re-runs of the same page don't create empty
// commits. Throws on git failure — callers treat asset hosting as best-effort.
export const commitAndPush = (relPaths, message) => {
  if (!relPaths.length) return;

  const git = (...args) => execFileSync("git", args, { stdio: "pipe" });
  git("config", "user.name", "github-actions[bot]");
  git(
    "config",
    "user.email",
    "41898282+github-actions[bot]@users.noreply.github.com"
  );
  git("add", ...relPaths);

  const pending = git("status", "--porcelain", ...relPaths).toString().trim();
  if (!pending) return; // already committed by a prior run

  git("commit", "-m", message);
  // Reduce the chance of a non-fast-forward push on an active branch.
  git("pull", "--rebase", "--autostash", "origin", BRANCH);
  git("push", "origin", `HEAD:${BRANCH}`);
};
