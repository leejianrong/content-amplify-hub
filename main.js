import "dotenv/config";
import { fetchContent } from "./services/fetchContent.js";
import { publishContent } from "./services/publishContent.js";
import { generateCover } from "./utils/cover/hostCover.js";
import { rehostImages } from "./utils/media/rehostImages.js";
import { commitAndPush } from "./utils/media/repoAsset.js";
import { sendEmail } from "./utils/failure/email.js";

const notionData = {
  env: process.env.ENVIRONMENT,
  pageId: "",
  devToContent: {
    title: "",
    body_markdown: "",
    description: "",
    main_image: "",
    tags: [],
    published: true,
    existingArticleId: "",
  },
};

// Re-host Notion-hosted assets (inline body images + an auto cover) into the
// repo so the published article never points at expiring Notion URLs. All
// best-effort: any failure is emailed but never blocks publishing. Only runs in
// CI, because it commits and pushes.
const prepareAssets = async (notionData) => {
  const article = notionData.devToContent;
  const assetPaths = [];

  let rehostedMarkdown = null;
  try {
    const result = await rehostImages(notionData.pageId, article.body_markdown);
    rehostedMarkdown = result.markdown;
    assetPaths.push(...result.relPaths);
  } catch (error) {
    await sendEmail("Image Re-host - Skipped", error.message);
  }

  let cover = null;
  if (!article.main_image) {
    try {
      cover = generateCover(notionData.pageId, article.title);
      assetPaths.push(cover.relPath);
    } catch (error) {
      await sendEmail("Cover Generation - Skipped", error.message);
    }
  }

  if (!assetPaths.length) return;

  try {
    commitAndPush(assetPaths, `chore(assets): media for "${article.title}"`);
    // Only reference the repo URLs once they are actually pushed and reachable.
    if (rehostedMarkdown !== null) article.body_markdown = rehostedMarkdown;
    if (cover) article.main_image = cover.url;
  } catch (error) {
    await sendEmail("Asset Commit - Skipped", error.message);
  }
};

const main = async () => {
  if (notionData.env !== "production") {
    console.log("Enter the Page Link ID: ");
    const pageLinkId = await new Promise((resolve) => {
      process.stdin.once("data", (data) => resolve(data.toString().trim()));
    });
    notionData.pageId = `${pageLinkId.slice(0, 8)}-${pageLinkId.slice(
      8,
      12
    )}-${pageLinkId.slice(12, 16)}-${pageLinkId.slice(16, 20)}-${pageLinkId.slice(
      20
    )}`;
  }

  try {
    await fetchContent(notionData);
  } catch (error) {
    await sendEmail("Notion Fetch - Error", error.message);
    process.exit(1);
  }

  if (notionData.env === "production") {
    await prepareAssets(notionData);
  }

  try {
    await publishContent(notionData);
  } catch (error) {
    await sendEmail("Publish Content - Error", error.message);
    process.exit(1); // fail loud: a publish error must turn the run red
  }
};

await main();
