import { publishHashnode } from "../utils/publish/hashnode.js";
import { markPublished } from "../utils/success/notion.js";
import { sendEmail } from "../utils/failure/email.js";

export const publishContent = async (notionData) => {
  const { url, id } = await publishHashnode(notionData.hashnodeContent);

  if (notionData.env !== "production") {
    console.log("Hashnode - Published URL:", url);
    console.log("Hashnode - Post ID:", id);
    process.exit(url ? 0 : 1);
  }

  if (!url) {
    // publishHashnode already emailed the GQL error. Leave Status as
    // "Ready to Publish" so the next scheduled run retries this page.
    process.exit(1);
  }

  await markPublished(notionData.pageId, url, id);
  await sendEmail("Publish - Success", `Published to Hashnode: ${url}`);
};
