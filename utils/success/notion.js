import { Client } from "@notionhq/client";
import { sendEmail } from "../failure/email.js";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Pure: the Notion property patch applied on a successful publish. Exported for
// unit testing.
export const buildPublishedProperties = (articleUrl, articleId) => {
  const properties = {
    Status: { select: { name: "Published" } },
  };

  if (articleUrl) {
    properties["Dev.to URL"] = { url: articleUrl };
  }

  if (articleId) {
    properties["Dev.to Article ID"] = {
      rich_text: [{ text: { content: String(articleId) } }],
    };
  }

  return properties;
};

// Close the loop after a successful dev.to publish: record the live URL and
// article ID, then flip Status to "Published" so the page is never picked up
// again (unless a human flips it back to re-publish an edit).
export const markPublished = async (pageId, articleUrl, articleId) => {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: buildPublishedProperties(articleUrl, articleId),
    });
  } catch (error) {
    await sendEmail("Notion Update - API Error", error.message);
    process.exit(1);
  }
};
