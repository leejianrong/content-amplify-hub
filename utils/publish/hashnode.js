import fetch from "node-fetch";
import { sendEmail } from "../failure/email.js";

const HASHNODE_GQL_URL = "https://gql.hashnode.com";
const HASHNODE_TOKEN = process.env.HASHNODE_TOKEN;

const publishPostMutation = `
  mutation PublishPost($input: PublishPostInput!) {
    publishPost(input: $input) {
      post {
        id
        title
        subtitle
        url
        publication {
          id
        }
        coverImage {
          url
        }
        tags {
          id
        }
        features {
          tableOfContents {
            isEnabled
          }
        }
      }
    }
  }
`;

const fetchGraphQL = async (query, variables) => {
  const response = await fetch(HASHNODE_GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: HASHNODE_TOKEN,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();
  if (result.errors) {
    await sendEmail("Hashnode - GQL Error", result.errors[0].message);
    return "";
  }
  return result.data;
};

export const publishHashnode = async (hashnodeContent) => {
  const {
    title,
    publicationId,
    contentMarkdown,
    subtitle,
    coverImageOptions,
    tags,
    settings,
  } = hashnodeContent;

  const input = {
    title,
    publicationId,
    contentMarkdown,
    tags,
    settings,
  };
  if (subtitle) {
    input.subtitle = subtitle;
  }
  // Only attach a cover when one was set — an empty URL is rejected.
  if (coverImageOptions?.coverImageURL) {
    input.coverImageOptions = coverImageOptions;
  }

  const response = await fetchGraphQL(publishPostMutation, { input });
  if (response === "") {
    return { url: "", id: "" };
  }
  return {
    url: response.publishPost.post.url,
    id: response.publishPost.post.id,
  };
};
