import { publishDevTo } from "../utils/publish/devTo.js";
import { markPublished } from "../utils/success/notion.js";
import { sendEmail } from "../utils/failure/email.js";

export const publishContent = async (notionData) => {
  const { url, id } = await publishDevTo(notionData.devToContent);

  if (notionData.env !== "production") {
    console.log("Dev.to - Published URL:", url);
    console.log("Dev.to - Article ID:", id);
    process.exit(url ? 0 : 1);
  }

  if (!url) {
    // publishDevTo already emailed the error. Leave Status as
    // "Ready to Publish" so the next scheduled run retries this page.
    process.exit(1);
  }

  await markPublished(notionData.pageId, url, id);
  await sendEmail("Publish - Success", `Published to dev.to: ${url}`);
};
