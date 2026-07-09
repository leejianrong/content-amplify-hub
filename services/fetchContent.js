import {
  getPageProperties,
  getPageContentMarkdown,
} from "../utils/fetch/notion.js";

// Pure mapping from Notion page properties (+ page body) to a dev.to article.
// Exported for unit testing.
export const mapArticle = (props, bodyMarkdown) => ({
  title: props["Name"]?.title?.[0]?.plain_text ?? "",
  body_markdown: bodyMarkdown,
  description: props["Subtitle"]?.rich_text?.[0]?.plain_text ?? "",
  // Optional cover; empty string means "auto-generate one" (see main.js).
  main_image: props["Cover Image"]?.url ?? "",
  // dev.to tags are plain names (lowercase, alphanumeric), max 4.
  tags: (props["Dev.to Tags"]?.multi_select ?? []).map((tag) => tag.name),
  // Present only after a prior publish — triggers an update instead of a
  // duplicate create (see utils/publish/devTo.js).
  existingArticleId:
    props["Dev.to Article ID"]?.rich_text?.[0]?.plain_text ?? "",
  published: true,
});

export const fetchContent = async (notionData) => {
  const pageDetails = await getPageProperties(notionData);
  if (notionData.env === "production") {
    notionData.pageId = pageDetails.id;
  }
  // Publish the whole page body.
  const bodyMarkdown = await getPageContentMarkdown(notionData.pageId);
  Object.assign(
    notionData.devToContent,
    mapArticle(pageDetails.properties, bodyMarkdown)
  );
  return notionData;
};
