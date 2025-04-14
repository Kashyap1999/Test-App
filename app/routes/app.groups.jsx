import {
  Text,
  Card,
  Layout,
  Page,
  BlockStack,
  Button,
  TextField,
  Autocomplete,
  Icon,
  InlineStack,
  EmptyState,
  ResourceList,
  ResourceItem,
} from "@shopify/polaris";

import { useState, useEffect } from "react";
import { PlusIcon, SearchIcon, EditIcon, XIcon, CheckIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useLoaderData, useFetcher } from "@remix-run/react";
import db from "../db.server";

export default function GroupsPage() {
  const { groups: initialGroups = [] } = useLoaderData();
  const [groups, setGroups] = useState(initialGroups);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const fetcher = useFetcher();

  const handleEditClick = (id, name) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSave = (id) => {
    fetcher.submit({ id, name: editName, action: "update" }, { method: "post" });
    setGroups(groups.map(group => (group.id === id ? { ...group, name: editName } : group)));
    setEditingId(null);
  };

  useEffect(() => {
    if (fetcher.data?.groups) {
      setGroups(fetcher.data.groups);
    }
  }, [fetcher.data]);

  return (
    <Page backAction={{ url: "/app" }} title="Group">
      <BlockStack gap="500">
        <Card roundedAbove="sm" padding="500">
          <InlineStack align="start" gap="300">
            <div style={{ flexGrow: 1 }}>
            <AutocompleteExample groups={groups} setGroups={setGroups} allGroups={initialGroups} />
            </div>
            <Button variant="primary" icon={PlusIcon} onClick={() => setIsAddingGroup(true)}>
              Add Group
            </Button>
          </InlineStack>
        </Card>

        {isAddingGroup && (
          <Card padding="500">
            <BlockStack gap="300">
              <fetcher.Form method="POST">
                <InlineStack align="start" gap="300">
                  <div style={{ flexGrow: 1 }}>
                    <TextField
                      name="name"
                      placeholder="Enter group name"
                      value={groupName}
                      onChange={(value) => setGroupName(value)}
                      autoComplete="off"
                    />
                  </div>
                  <Button submit variant="primary">Add</Button>
                  <Button variant="secondary" onClick={() => setIsAddingGroup(false)}>Cancel</Button>
                </InlineStack>
              </fetcher.Form>
            </BlockStack>
          </Card>
        )}

        <Layout gap="500">
          <Layout.Section>
            <Card gap="300">
              {groups.length > 0 ? (
                <ResourceList
                  resourceName={{ singular: "manage group", plural: "manage groups" }}
                  items={groups}
                  renderItem={(item) => {
                    const { id, name } = item;
                    return (
                      <ResourceItem
                        id={id} persistActions
                        shortcutActions={[
                          {
                            content: <Icon source={EditIcon} tone="base" />,
                            accessibilityLabel: `Edit`,
                            onAction: () => handleEditClick(id, name)
                          },
                          {
                            content: <Icon source={DeleteIcon} tone="critical" />,
                            accessibilityLabel: `Delete`,
                            onAction: () => fetcher.submit({ action: "delete", id }, { method: "post" }),
                          },
                        ]}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {editingId === id ? (
                            <>
                              <TextField
                                value={editName}
                                onChange={(value) => setEditName(value)}
                                autoComplete="off"
                              />
                              <Button onClick={() => handleSave(id)} icon={CheckIcon} />
                              <Button onClick={() => setEditingId(null)}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Text variant="bodyMd" fontWeight="bold">{name}</Text>
                            </>
                          )}
                        </div>
                      </ResourceItem>
                    );
                  }}
                />
              ) : (
                <EmptyState
                  heading="Manage your attribute groups"
                  action={{ content: "Add group", onAction: () => setIsAddingGroup(true) }}
                  secondaryAction={{ content: "Learn more", url: "https://help.shopify.com" }}
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Track and add your attribute groups.</p>
                </EmptyState>
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

export async function loader() {
  const groups = await db.groups.findMany();
  return new Response(JSON.stringify({ groups }), { headers: { "Content-Type": "application/json" } });
}

export async function action({ request }) {
  const formData = await request.formData();
  const name = formData.get("name");
  const id = formData.get("id");
  const actionType = formData.get("action");

  try {
    if (actionType === "update") {
      if (!id || !name) {
        return new Response(JSON.stringify({ error: "Invalid data" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await db.groups.update({ where: { id }, data: { name } });
    } else if (actionType === "delete") {
      if (!id) {
        return new Response(JSON.stringify({ error: "Group ID is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      await db.groups.delete({ where: { id } });
    } else if (name) {
      await db.groups.create({ data: { name } });
    } else {
      return new Response(JSON.stringify({ error: "Invalid data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const groups = await db.groups.findMany();
    return new Response(JSON.stringify({ groups }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Database operation failed", details: error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function AutocompleteExample({ groups = [], setGroups, allGroups }) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState([]);

  const updateText = (value) => {
    setInputValue(value);

    if (!Array.isArray(groups)) return;

    if (value === "") {
      // Reset to show all groups when input is cleared
      setGroups(allGroups);
    } else {
      setOptions(
        groups
          .filter((group) => group.name?.toLowerCase().includes(value.toLowerCase()))
          .map((group) => ({ value: group.id, label: group.name }))
      );
    }
  };

  const handleSelect = (selected) => {
    const selectedGroup = allGroups.find((group) => group.id === selected[0]);
    if (selectedGroup) {
      setGroups([selectedGroup]); // Show only selected group
      setInputValue(selectedGroup.name); // Update input
    }
  };

  return (
    <Autocomplete
      options={options}
      selected={[]}
      onSelect={handleSelect}
      textField={
        <Autocomplete.TextField
          onChange={updateText}
          value={inputValue}
          prefix={<Icon source={SearchIcon} tone="base" />}
          placeholder="Search"
          autoComplete="off"
        />
      }
    />
  );
}
