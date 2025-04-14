import React, { useState } from "react";
import { Page, Card, ResourceList, ResourceItem, Text, Button, Spinner } from "@shopify/polaris";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";


const ProductList = () => {
  const loaderData = useLoaderData();
  console.log("Loader Data:", loaderData); // Debugging output

  const products = loaderData ?? { edges: [], pageInfo: { hasNextPage: false } };
  console.log("products:", products);

  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(products.pageInfo?.hasNextPage || false);
  const [cursor, setCursor] = useState(products.edges.length ? products.edges[products.edges.length - 1].cursor : null);
  const [productList, setProductList] = useState(products.edges.map((edge) => edge.node));

  const [sortValue, setSortValue] = useState('DATE_MODIFIED_DESC');


  return (
    <Page title="Products">
      <Card>
        <ResourceList
          resourceName={{ singular: "product", plural: "products" }}
          items={productList}
          sortValue={sortValue}
          sortOptions={[
            {label: 'Newest', value: 'DATE_MODIFIED_DESC'},
            {label: 'Oldest', value: 'DATE_MODIFIED_ASC'},
          ]}
          onSortChange={(selected) => {
            setSortValue(selected);
          }}
          renderItem={(item) => (
            <ResourceItem 
            id={item.id} 
            accessibilityLabel={`View details for ${item.title}`}
            persistActions
            >
              <Text variant="bodyMd" fontWeight="bold" as="h3">{item.title}</Text>
              <p>{item.description}</p>
            </ResourceItem>
          )}
          
        />
        {loading && <Spinner accessibilityLabel="Loading products" size="large" />}
        {hasNextPage && !loading && (
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Button>Load More</Button>
          </div>
        )}
      </Card>
    </Page>
  );
};

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    console.log("admin Response:", admin); 
    const response = await admin.graphql(`
      query {
        products(first: 10) {
          edges {
            cursor
            node {
              title
              description
              priceRange {
                minVariantPrice {
                  amount
                }
              }
            }
          }
        }
      }
    `);
    
    const json = await response.json(); // convert raw response string to JSON
    const products = json?.data?.products;

    if (!products) {
      console.error("❌ Invalid GraphQL response:", json);
      return new Response(JSON.stringify({ edges: [], pageInfo: { hasNextPage: false } }), {
        status: 500,
      });
    }
  
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Error fetching products:", error);
    return new Response(JSON.stringify({ edges: [], pageInfo: { hasNextPage: false } }), { status: 500 });
  }
};


export default ProductList;
