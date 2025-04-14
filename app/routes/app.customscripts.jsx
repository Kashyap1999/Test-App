import { useState, useCallback, useEffect } from "react";
import {
  Page,
  Layout,
  Card,
  Select,
  Text,
  Button,
  TextField,
  Spinner,
  Banner,
  List,
} from "@shopify/polaris";
import { useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton";
import React from "react";



export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      markets(first: 1) {
        edges {
          node {
            id
          }
        }
      }

      metafieldDefinitions(first: 10, ownerType: MARKET, namespace: "custom_scripts") {
        edges {
          node {
            key
          }
        }
      }
    }
  `);

  const body = await response.json();

  const marketId = body?.data?.markets?.edges?.[0]?.node?.id;

  const defs = body?.data?.metafieldDefinitions?.edges || [];
  const keys = defs.map((def) => def.node.key);

  let metafieldValues = {};
  if (marketId) {
    const metafieldsResponse = await admin.graphql(`
      query {
        node(id: "${marketId}") {
          ... on Market {
            metafields(first: 10, namespace: "custom_scripts") {
              edges {
                node {
                  key
                  value
                }
              }
            }
          }
        }
      }
    `);

    const metafieldsBody = await metafieldsResponse.json();
    const metafields = metafieldsBody?.data?.node?.metafields?.edges || [];
    metafieldValues = Object.fromEntries(
      metafields.map((mf) => [mf.node.key, mf.node.value])
    );
  }

  return new Response(
    JSON.stringify({
      hasHead: keys.includes("head_script"),
      hasBody: keys.includes("body_script"),
      headValue: metafieldValues["head_script"] || "",
      bodyValue: metafieldValues["body_script"] || "",
      marketId,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}


// === Main Component ===
export default function LayoutExample() {

  const navigation = useNavigation();
  const isPageLoading = navigation.state === "loading";

  if (isPageLoading) {
    return <LoadingSkeleton />;
  }

  const fetcher = useFetcher();
  const { hasHead, hasBody, headValue, bodyValue } = useLoaderData();
  const metafieldsExist = hasHead && hasBody;

  const [scriptPlacement, setScriptPlacement] = useState("head");
  const [value, setValue] = useState(scriptPlacement === "head" ? headValue : bodyValue);
  const isSubmitting = fetcher.state !== "idle";
  const [showSuccess, setShowSuccess] = useState(false);
  const [successTitle, setSuccessTitle] = useState("");

  // Update value when placement changes
  const handlePlacementChange = useCallback((newValue) => {
    setScriptPlacement(newValue);
    setValue(newValue === "head" ? headValue : bodyValue);
  }, [headValue, bodyValue]);

  const handleValueChange = useCallback((newValue) => setValue(newValue), []);

  const options = [
    { label: "Head", value: "head" },
    { label: "Body", value: "body" },
  ];

  async function handleGenerateMetafields() {
    try {
      const res = await fetch("/metafields/generate", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessTitle("Metafields generated successfully!");
        setShowSuccess(true);
      } else {
        alert("Failed to create metafields: " + data.error);
      }
    } catch (err) {
      console.error("Error generating metafields", err);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setSuccessTitle("Data saved into metafields successfully.");
      setShowSuccess(true);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Page >
      {showSuccess && (
        <Banner
          title={successTitle}
          tone="success"
          onDismiss={() => setShowSuccess(false)}
        />
      )}
      {!metafieldsExist && (
        <Banner
          title="Do you want to structure your metafields?"
          action={{ content: "Generate metafields", onAction: handleGenerateMetafields }}
          tone="warning"
        >
          <List>
            <List.Item>
              If you generate the metafields, your scripts will be saved as <b>structured</b> metafields on the <code>Market</code> resource.
            </List.Item>
            <List.Item>
              If you skip this step, scripts will still be saved but as <b>unstructured</b> metafields.
            </List.Item>
          </List>
        </Banner>
      )}
      <br />
      <Layout>
        <div  style={{ width:"300px" }}>
        <Layout.Section variant="oneThird">
          <Card title="Custom Script" sectioned>
            <Select
              // label="Custom Script Add On"
              label="Select Tag to Display script"
              options={options}
              onChange={handlePlacementChange}
              value={scriptPlacement}
            />
            <br />
            <p>This custom script is render on the before closing the selected tag.</p>
          </Card>
        </Layout.Section>
        </div>

        <Layout.Section>
          <Card title="Tags" sectioned>
            <fetcher.Form method="POST" action="/scripts">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text variant="headingMd">Enter Script:</Text>
                <Button submit variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? <Spinner size="small" /> : "Submit"}
                </Button>
              </div>
              <br />

              {scriptPlacement === "head" && (
                <TextField
                  name="head"
                  value={value}
                  onChange={handleValueChange}
                  multiline={10}
                  autoComplete="off"
                />
              )}

              {scriptPlacement === "body" && (
                <TextField
                  name="body"
                  value={value}
                  onChange={handleValueChange}
                  multiline={10}
                  autoComplete="off"
                />
              )}
              <br />
            </fetcher.Form>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
