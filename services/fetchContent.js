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
  // Publish the whole page body.
  const bodyMarkdown = await getPageContentMarkdown(notionData.pageId);

  const article = notionData.devToContent;
  article.title = props["Name"]?.title?.[0]?.plain_text ?? "";
  article.body_markdown = bodyMarkdown;
  article.description = props["Subtitle"]?.rich_text?.[0]?.plain_text ?? "";
  // Optional cover; empty string means "auto-generate one" (see main.js).
  article.main_image = props["Cover Image"]?.url ?? "";
  // dev.to tags are plain names (lowercase, alphanumeric), max 4.
  article.tags = (props["Dev.to Tags"]?.multi_select ?? []).map(
    (tag) => tag.name
  );

  return notionData;
};
