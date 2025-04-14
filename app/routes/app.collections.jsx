import { useLoaderData } from "@remix-run/react";
import { apiVersion, authenticate } from "../shopify.server";
import { Card, Layout, Page, List, Text } from "@shopify/polaris";

export const query = `
{
  collections(first: 20) {
    edges{
      node{
        id
        handle
        title
        description
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
`

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request)
  const { shop, accessToken } = session;

  try {
    // console.log(shop, 'shop');
    // console.log(apiVersion, 'apiVersion');

    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken
      },
      body: JSON.stringify({ query }),
    });

    // console.log(response);


    if (response.ok) {
      const data = await response.json()

      const {
        data: {
          collections: { edges }
        }
      } = data;

      return edges;
    }

    return null;

  } catch (error) {
    console.log(error, "error")
  }
}


const collections = () => {
  const collections = useLoaderData();
  // console.log(collections, 'data');

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text  variant="heading2xl" tone="text-inverse-secondary" gap="loose" as="h1">Collection List</Text>
            <br />
            <List type="" gap="loose">
              {
                collections?.map(edge => {
                  const { node: item } = edge;
                  return (
                    <List.Item>
                      <h2>{item.title}</h2>
                    </List.Item>
                  )
                })
              }
            </List>
            <br />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default collections;