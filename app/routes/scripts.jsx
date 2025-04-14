import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const headScript = formData.get("head");
  const bodyScript = formData.get("body");

  try {
    // Step 1: Fetch markets
    const marketsQuery = await admin.graphql(`
      {
        markets(first: 100) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `);

    const res = await marketsQuery.json()
    // console.log("res", res);
        
    const allMarkets = res?.data?.markets?.edges || [];
    // const activeMarkets = allMarkets.filter(({ node }) => node.marketStatus === "ACTIVE");

    // Step 2: Update metafields for each market
    const mutationResults = [];

    for (const market of allMarkets) {
      const marketId = market.node.id;

      const fields = [];

      if (headScript) {
        fields.push(`{
          namespace: "custom_scripts",
          key: "head_script",
          type: "multi_line_text_field",
          value: """${headScript}""",
          ownerId: "${marketId}"
        }`);
      }

      if (bodyScript) {
        fields.push(`{
          namespace: "custom_scripts",
          key: "body_script",
          type: "multi_line_text_field",
          value: """${bodyScript}""",
          ownerId: "${marketId}"
        }`);
      }

      if (fields.length > 0) {
        const mutation = `
          mutation {
            metafieldsSet(metafields: [${fields.join(",")}]) {
              metafields {
                key
                namespace
              }
              userErrors {
                message
              }
            }
          }
        `;

        const res = await admin.graphql(mutation);
        const data = await res.json();
        console.log("data", data);
        
        mutationResults.push(data);
      }
    }

    return new Response(
      JSON.stringify({ success: true, marketsUpdated: allMarkets.length, mutationResults }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Metafield update failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update metafields", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
