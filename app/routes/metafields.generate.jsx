// app/routes/metafields/generate.jsx
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  try {
    const headResponse = await admin.graphql(`
      mutation {
        metafieldDefinitionCreate(definition: {
          namespace: "custom_scripts",
          key: "head_script",
          name: "Head Script",
          description: "Custom script to be injected in the <head>",
          type: "multi_line_text_field",
          ownerType: MARKET
        }) {
          createdDefinition {
            id
            key
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    const bodyResponse = await admin.graphql(`
      mutation {
        metafieldDefinitionCreate(definition: {
          namespace: "custom_scripts",
          key: "body_script",
          name: "Body Script",
          description: "Custom script to be injected in the <body>",
          type: "multi_line_text_field",
          ownerType: MARKET
        }) {
          createdDefinition {
            id
            key
            name
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    return new Response(
      JSON.stringify({
        success: true,
        headResult: headResponse,
        bodyResult: bodyResponse,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Metafield generation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to create metafields",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
