import "dotenv/config";
import { fetchContent } from "./services/fetchContent.js";
import { publishContent } from "./services/publishContent.js";
import { generateAndHostCover } from "./utils/cover/hostCover.js";
import { sendEmail } from "./utils/failure/email.js";

const notionData = {
  env: process.env.ENVIRONMENT,
  pageId: "",
  hashnodeContent: {
    title: "",
    publicationId: "",
    contentMarkdown: "",
    subtitle: "",
    coverImageOptions: {
      coverImageURL: "",
      isCoverAttributionHidden: true,
      stickCoverToBottom: false,
    },
    tags: [],
    settings: {
      enableTableOfContent: true,
    },
  },
};

const main = async () => {
  if (notionData.env !== "production") {
    console.log("Enter the Page Link ID: ");
    const pageLinkId = await new Promise((resolve) => {
      process.stdin.once("data", (data) => {
        resolve(data.toString().trim());
      });
    });
    const pageId = `${pageLinkId.slice(0, 8)}-${pageLinkId.slice(8,12)}-${pageLinkId.slice(12, 16)}-${pageLinkId.slice(16,20)}-${pageLinkId.slice(20)}`;
    notionData.pageId = pageId;
  }
  try {
    await fetchContent(notionData);
  } catch (error) {
    await sendEmail("Notion Fetch - Error", error.message);
    process.exit(1);
  }

  // Auto-generate a cover only when the author didn't set one. Best-effort:
  // a failure here must never block publishing, and it only pushes in CI.
  const hn = notionData.hashnodeContent;
  if (notionData.env === "production" && !hn.coverImageOptions.coverImageURL) {
    try {
      hn.coverImageOptions.coverImageURL = await generateAndHostCover(
        notionData.pageId,
        hn.title
      );
    } catch (error) {
      await sendEmail("Cover Generation - Skipped", error.message);
    }
  }

  try {
    await publishContent(notionData);
  } catch (error) {
    await sendEmail("Publish Content - Error", error.message);
  }
};

await main();
