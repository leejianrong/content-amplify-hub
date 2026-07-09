import {
  getPageProperties,
  getPageContentMarkdown,
} from "../utils/fetch/notion.js";

export const fetchContent = async (notionData) => {
  const pageDetails = await getPageProperties(notionData);
  if (notionData.env === "production") {
    notionData.pageId = pageDetails.id;
  }

  const props = pageDetails.properties;
  // Publish the whole page body — no "## Introduction" slicing.
  const contentMarkdown = await getPageContentMarkdown(notionData.pageId);

  const hn = notionData.hashnodeContent;
  hn.title = props["Name"]?.title?.[0]?.plain_text ?? "";
  hn.publicationId = process.env.HASHNODE_PUBLICATION_ID;
  hn.contentMarkdown = contentMarkdown;
  hn.subtitle = props["Subtitle"]?.rich_text?.[0]?.plain_text ?? "";
  // Optional: empty string means "no cover" and is omitted at publish time.
  hn.coverImageOptions.coverImageURL = props["Cover Image"]?.url ?? "";
  // Hashnode expects tag IDs, not names — the multi-select stores the IDs.
  hn.tags = (props["Hashnode Tag IDs"]?.multi_select ?? []).map((tag) => ({
    id: tag.name,
  }));

  return notionData;
};
