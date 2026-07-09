import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { sendEmail } from "../failure/email.js";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DB_ID;

export const getPageProperties = async (notionData) => {
  if (notionData.env !== "production") {
    const response = await notion.pages.retrieve({
      page_id: notionData.pageId,
    });
    return response;
  } else {
    try {
      // Publish the oldest page currently approved for publishing. Because we
      // only ever match "Ready to Publish" (and flip it to "Published" on
      // success), a page is never picked up twice — dedup is automatic.
      const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: "Status",
          select: { equals: "Ready to Publish" },
        },
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
        page_size: 1,
      });
      if (response.results.length === 0) {
        // An empty queue is normal for a frequent drain cron, not a failure.
        console.log(
          'No pages with Status = "Ready to Publish". Nothing to do.'
        );
        process.exit(0);
      }
      return response.results[0];
    } catch (error) {
      await sendEmail("Notion Fetch - API Error", error.message);
      process.exit(1);
    }
  }
};

const n2m = new NotionToMarkdown({ notionClient: notion });

export const getPageContentMarkdown = async (pageId) => {
  const mdblocks = await n2m.pageToMarkdown(pageId);
  const mdString = n2m.toMarkdownString(mdblocks);
  return mdString.parent.trim();
};
