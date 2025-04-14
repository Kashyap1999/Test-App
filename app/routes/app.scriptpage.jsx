import React, { useState, useCallback } from "react";
import { Page, Card, TextField, Text, Button, Spinner } from "@shopify/polaris";
import { useLoaderData, useFetcher, useNavigation } from "@remix-run/react";
import LoadingSkeleton from "../components/LoadingSkeleton";
import db from "../db.server";

export async function loader() {
  const scriptTableData = await db.customScripts.findMany();
  return new Response(JSON.stringify({ scriptTableData }), { headers: { "Content-Type": "application/json" } });
}

export async function action({ request }) {
  const formData = await request.formData();
  const scriptData = formData.get("data");

  try {
    // Try to find the first existing script
    const existingScript = await db.customScripts.findFirst();

    let result;
    if (existingScript) {
      // Update existing
      result = await db.customScripts.update({
        where: { id: existingScript.id },
        data: { data: scriptData },
      });
    } else {
      // Create new
      result = await db.customScripts.create({
        data: { data: scriptData },
      });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Database operation failed", details: error }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

const ScriptPage = () => {

  const navigation = useNavigation();
  const isPageLoading = navigation.state === "loading";

  if (isPageLoading) {
    return <LoadingSkeleton />;
  }


  const scriptData = useLoaderData();

  return (
    <Page>
      <Card sectioned>
        <MultilineFieldExample scriptData={scriptData} />
        <br />
      </Card>
    </Page>
  );
};

function MultilineFieldExample({ scriptData }) {
  const fetcher = useFetcher();

  // Safe fallback if no data is returned yet
  const initialValue = scriptData?.scriptTableData?.[0]?.data ?? "";

  const [value, setValue] = useState(initialValue);
  const isSubmitting = fetcher.state !== "idle";

  const handleChange = useCallback((newValue) => setValue(newValue), []);

  return (
    <fetcher.Form method="POST">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="heading2xl" as="h1">
          Enter Custom Script
        </Text>
        <Button submit variant="primary" disabled={isSubmitting} >
          {isSubmitting ? (
            <Spinner size="small" accessibilityLabel="Submitting" />
          ) : (
            "Submit"
          )}
        </Button>
      </div>
      <br />
      <TextField
        name="data"
        label="This script will be added in the header"
        value={value}
        onChange={handleChange}
        multiline={4}
        autoComplete="off"
      />
      <br />
    </fetcher.Form>
  );
}

export default ScriptPage;
