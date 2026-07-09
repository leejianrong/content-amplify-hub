import axios from "axios";
import { sendEmail } from "../failure/email.js";

// Publishes (or updates) an article on dev.to via the Forem API. When
// existingArticleId is set the post is updated in place (PUT) instead of
// creating a duplicate, so re-running a page is idempotent. Returns { url, id };
// on failure it emails the detail and returns empty strings, letting the caller
// decide what to do rather than throwing an opaque error.
export const publishDevTo = async (devToContent) => {
  const {
    title,
    body_markdown,
    description,
    main_image,
    tags,
    published,
    existingArticleId,
  } = devToContent;

  const article = { title, body_markdown, published, tags };
  // dev.to rejects an empty main_image/description, so only send when present.
  if (main_image) article.main_image = main_image;
  if (description) article.description = description;

  const isUpdate = Boolean(existingArticleId);
  const url = isUpdate
    ? `https://dev.to/api/articles/${existingArticleId}`
    : "https://dev.to/api/articles";

  try {
    const { data } = await axios({
      method: isUpdate ? "put" : "post",
      url,
      data: { article },
      headers: { "api-key": process.env.DEVTO_TOKEN },
    });
    return { url: data.url, id: data.id };
  } catch (error) {
    const detail = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    await sendEmail("Dev.to - API Error", detail);
    return { url: "", id: "" };
  }
};
