import axios from "axios";
import { sendEmail } from "../failure/email.js";

// Publishes an article to dev.to via the Forem API. Returns { url, id }.
// On failure it emails the error detail and returns empty strings, so the
// caller decides what to do (rather than throwing an opaque error).
export const publishDevTo = async (devToContent) => {
  const { title, body_markdown, description, main_image, tags, published } =
    devToContent;

  const article = { title, body_markdown, published, tags };
  // dev.to rejects an empty main_image/description, so only send when present.
  if (main_image) article.main_image = main_image;
  if (description) article.description = description;

  try {
    const { data } = await axios.post(
      "https://dev.to/api/articles",
      { article },
      { headers: { "api-key": process.env.DEVTO_TOKEN } }
    );
    return { url: data.url, id: data.id };
  } catch (error) {
    const detail = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    await sendEmail("Dev.to - API Error", detail);
    return { url: "", id: "" };
  }
};
