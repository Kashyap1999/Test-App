import { apiVersion, authenticate } from "../shopify.server";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { Card, Layout, Page, List, Text } from "@shopify/polaris";
import LoadingSkeleton from "../components/LoadingSkeleton";


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


const Collections = () => {
  const navigation = useNavigation();
  const isPageLoading = navigation.state === "loading";
  
  if (isPageLoading) {
    return <LoadingSkeleton />;
  }

  const collections = useLoaderData();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text variant="heading2xl" tone="text-inverse-secondary" as="h1">
              Collection List
            </Text>
            <br />
            {
              <List gap="loose">
                {
                  collections?.map(edge => {
                    const { node: item } = edge;
                    return (
                      <List.Item key={item.id}>
                        <h2>{item.title}</h2>
                        <p>{item.description}</p>
                      </List.Item>
                    )
                  })
                }
              </List>
            }
            <br />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Collections;
