import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Page,
  Card,
  TextField,
  InlineStack,
  Tag,
  Text,
  Button,
  Select,
  BlockStack,
  Combobox,
  Listbox,
} from "@shopify/polaris";
import {
  useLoaderData,
  useNavigation,
  useParams,
  Link,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import db from "../db.server"; // adjust path to your Prisma setup

const ProductList = () => {
  const navigation = useNavigation();
  const isPageLoading = navigation.state === "loading";
  const { product_handle } = useParams();
  const { product, attributes, groups } = useLoaderData();

  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});

  if (isPageLoading) {
    return <LoadingSkeleton />;
  }

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

  const groupOptions = groups.map((group) => ({
    label: group.name,
    value: group.id,
  }));

  return (
    <Page title={product?.title || "Product"}>
      <Card sectioned>
        {product ? (
          <>
            <Text variant="headingLg">{product.title}</Text>
            <Text>{product.description}</Text>
          </>
        ) : (
          <Text>Product not found</Text>
        )}

        {/* Multi Group Select */}
        <div style={{ marginTop: "20px" }}>
          <Text variant="headingMd">Select Groups:</Text>
          <GroupSelector
            groups={groups}
            selectedGroups={groups.filter((g) =>
              selectedGroupIds.includes(g.id),
            )}
            onGroupSelect={(selected) =>
              setSelectedGroupIds(selected.map((g) => g.id))
            }
          />
        </div>

        {/* Grouped Attributes Inputs */}
        {selectedGroupIds.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <BlockStack gap="300">
              {Object.entries(groupedAttributes).map(([groupName, attrs]) => (
                <Card key={groupName} title={groupName} sectioned>
                  <Text variant="headingMd" as="h6">
                    {groupName}
                  </Text>
                  <br />
                  <BlockStack gap="200">
                    {attrs.map((attr) => (
                      <TextField
                        key={attr.id}
                        label={attr.name}
                        value={attributeValues[attr.id] || ""}
                        onChange={(val) => handleValueChange(attr.id, val)}
                        autoComplete="off"
                        gap="200"
                      />
                    ))}
                  </BlockStack>
                </Card>
              ))}
            </BlockStack>
          </div>
        )}

        {/* JSON Output */}
        {selectedGroupIds.length > 0 && (
          <div style={{ marginTop: "30px" }}>
            <Text variant="headingMd">Generated JSON:</Text>
            <pre
              style={{
                background: "#f6f6f7",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              {JSON.stringify(formattedOutput, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: "20px" }}>
          <Link to="/app/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </Card>
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
            placeholder="Search Groups"
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
