import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Page,
  Card,
  TextField,
  Tag,
  Text,
  Button,
  BlockStack,
  Combobox,
  Listbox,
  Layout,
  EmptyState,
} from "@shopify/polaris";
import {
  useLoaderData,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { DeleteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton";
import db from "../db.server"; // adjust path to your Prisma setup

const ProductList = () => {
  const navigation = useNavigation();
  const isPageLoading = navigation.state === "loading";
  const { product_handle } = useParams();

  if (isPageLoading) {
    return <LoadingSkeleton />;
  }

  const { product, attributes, groups } = useLoaderData();
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});

  // Filter attributes that belong to selected groups
  const groupMap = Object.fromEntries(groups.map((g) => [g.id, g.name]));

  const groupedAttributes = selectedGroupIds.reduce((acc, groupId) => {
    const groupName = groupMap[groupId];
    acc[groupName] = attributes.filter((attr) =>
      attr.groups.some((g) => g.id === groupId),
    );
    return acc;
  }, {});

  const handleValueChange = (attrId, value) => {
    setAttributeValues((prev) => ({ ...prev, [attrId]: value }));
  };

  const formattedOutput = Object.entries(groupedAttributes).reduce(
    (result, [groupName, attrs]) => {
      result[groupName] = {};
      attrs.forEach((attr) => {
        result[groupName][attr.name] = attributeValues[attr.id] || "";
      });
      return result;
    },
    {},
  );

  const initialValues = useMemo(() => {
    const initial = {};
    attributes.forEach((attr) => {
      initial[attr.id] = "";
    });
    return initial;
  }, [attributes]);

  // 4. Change tracker
  const hasChanges = useMemo(() => {
    return Object.entries(attributeValues).some(
      ([key, val]) => val !== initialValues[key],
    );
  }, [attributeValues, initialValues]);

  return (
    <Page
      title={product?.title || "Product"}
      backAction={{ content: "Products", url: "/app/products" }}
      secondaryActions={[
        {
          content: "Create Groups",
          url: "/app/groups",
        },
        {
          content: "Create Attributes",
          url: "/app/attributes",
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card sectioned>
            {/* Grouped Attributes Inputs */}
            {selectedGroupIds.length > 0 ? (
              <div style={{ marginTop: "30px" }}>
                <BlockStack gap="300">
                  {Object.entries(groupedAttributes).map(
                    ([groupName, attrs]) => {
                      const group = groups.find((g) => g.name === groupName);
                      if (!group) return null;

                      return (
                        <Card key={groupName} title={groupName} sectioned>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text variant="headingMd" as="h6">
                              {groupName}
                            </Text>
                            <Button
                              tone="critical"
                              variant="tertiary"
                              size="slim"
                              icon={DeleteIcon}
                              onClick={() => {
                                setSelectedGroupIds((prev) => {
                                  const updatedGroupIds = prev.filter((id) => id !== group.id);
                                  // Find all attribute IDs tied to this group
                                  const attributesToRemove = attributes
                                    .filter((attr) =>
                                      attr.groups.some((g) => g.id === group.id)
                                    )
                                    .map((attr) => attr.id);
                                  // Remove those attributes from the state
                                  setAttributeValues((prevValues) => {
                                    const updatedValues = { ...prevValues };
                                    attributesToRemove.forEach((id) => {
                                      delete updatedValues[id];
                                    });
                                    return updatedValues;
                                  });
                                  return updatedGroupIds;
                                });
                              }}
                            />
                          </div>
                          <br />
                          <BlockStack gap="200">
                            {attrs.map((attr) => (
                              <TextField
                                key={attr.id}
                                label={attr.name}
                                value={attributeValues[attr.id] || ""}
                                onChange={(val) =>
                                  handleValueChange(attr.id, val)
                                }
                                autoComplete="off"
                                gap="200"
                              />
                            ))}
                          </BlockStack>
                        </Card>
                      );
                    },
                  )}
                </BlockStack>
              </div>
            ) : (
              <EmptyState
                heading="No groups selected"
                action={{
                  content: "Select groups",
                  onAction: () => {
                    // Scroll to group selector or focus it if needed
                    document
                      .querySelector("input[placeholder='Select Groups']")
                      ?.focus();
                  },
                }}
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png" // You can use Polaris CDN images
              >
                <p>
                  Select one or more groups to start customizing product
                  attributes.
                </p>
              </EmptyState>
            )}
          </Card>
        </Layout.Section>
        <div style={{ width: "350px" }}>
          <Layout.Section variant="oneThird">
            <Card title="Custom Script" sectioned>
              <GroupSelector
                groups={groups}
                selectedGroups={groups.filter((g) =>
                  selectedGroupIds.includes(g.id),
                )}
                onGroupSelect={(selected) =>
                  setSelectedGroupIds(selected.map((g) => g.id))
                }
              />
              <br />
              {hasChanges && (
                <div style={{ marginTop: "20px" }}>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => console.log("Save clicked", attributeValues)}
                  >
                    Save
                  </Button>
                </div>
              )}
            </Card>
            <br />
            {/* JSON Output */}
            {selectedGroupIds.length > 0 && (
              <Card>
                <div style={{ marginTop: "0" }}>
                  <Text variant="headingMd">Generated JSON:</Text>
                  <pre
                    style={{
                      background: "#f6f6f7",
                      padding: ".5rem",
                      borderRadius: "8px",
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      wordWrap: "break-word",
                      overflowX: "auto",
                    }}
                  >
                    {JSON.stringify(formattedOutput, null, 2)}
                  </pre>
                </div>
              </Card>
            )}
          </Layout.Section>
        </div>
      </Layout>
    </Page>
  );
};

export const loader = async ({ request, params }) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Fetch product by handle from Shopify
    let product = null;
    if (params.product_handle) {
      const response = await admin.graphql(`
        query {
          productByHandle(handle: "${params.product_handle}") {
            id
            handle
            title
          }
        }
      `);

      const json = await response.json();
      product = json?.data?.productByHandle;

      if (!product) {
        return new Response(JSON.stringify({ error: "Product not found" }), {
          status: 404,
        });
      }
    }

    // Fetch groups and their attributes from your DB
    const attributes = await db.attributes.findMany({
      include: {
        groups: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const groups = await db.groups.findMany({});

    return new Response(JSON.stringify({ product, attributes, groups }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error in loader:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

export function GroupSelector({
  groups = [],
  onGroupSelect,
  selectedGroups = [],
}) {
  const [selectedGroupIds, setSelectedGroupIds] = useState(
    selectedGroups.map((group) => group.id),
  );
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setSelectedGroupIds(selectedGroups.map((group) => group.id));
  }, [selectedGroups]);

  const toggleGroupSelection = useCallback(
    (groupId) => {
      setSelectedGroupIds((prevSelected) => {
        const updatedSelection = new Set(prevSelected);
        if (updatedSelection.has(groupId)) {
          updatedSelection.delete(groupId);
        } else {
          updatedSelection.add(groupId);
        }

        const selected = groups.filter((g) => updatedSelection.has(g.id));
        onGroupSelect?.(selected);
        return [...updatedSelection];
      });
    },
    [groups, onGroupSelect],
  );

  const removeGroup = useCallback(
    (groupId) => () => {
      toggleGroupSelection(groupId);
    },
    [toggleGroupSelection],
  );

  const filteredGroups = useMemo(() => {
    if (!searchValue) return groups;
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [searchValue, groups]);

  const selectedGroupTags = selectedGroupIds.length > 0 && (
    <Card spacing="extraTight">
      {selectedGroupIds.map((id) => {
        const group = groups.find((g) => g.id === id);
        return group ? (
          <Tag key={group.id} onRemove={removeGroup(group.id)}>
            {group.name}
          </Tag>
        ) : null;
      })}
    </Card>
  );

  return (
    <div>
      <Combobox
        allowMultiple
        activator={
          <Combobox.TextField
            autoComplete="off"
            label="Select Groups"
            labelHidden
            value={searchValue}
            placeholder="Select Groups"
            verticalContent={selectedGroupTags}
            onChange={setSearchValue}
          />
        }
      >
        {filteredGroups.length > 0 ? (
          <Listbox onSelect={toggleGroupSelection}>
            {filteredGroups.map((group) => (
              <Listbox.Option
                key={group.id}
                value={group.id}
                selected={selectedGroupIds.includes(group.id)}
              >
                <Listbox.TextOption
                  selected={selectedGroupIds.includes(group.id)}
                >
                  {group.name}
                </Listbox.TextOption>
              </Listbox.Option>
            ))}
          </Listbox>
        ) : (
          <EmptySearchResult title="No Groups Found" />
        )}
      </Combobox>
    </div>
  );
}

export default ProductList;