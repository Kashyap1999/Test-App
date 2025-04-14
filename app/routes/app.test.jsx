import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  EmptyState,
  ButtonGroup,
  Button
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function AdditionalPage() {
  return (
    <Page>
      <TitleBar title="Test page" />
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="Manage your inventory transfers"
              action={{ content: 'Add transfer', url: '/app/additional' }}
              secondaryAction={{
                content: 'Learn more',
                url: 'https://help.shopify.com',
              }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Track and receive your incoming inventory from suppliers.</p>
            </EmptyState>
            <ButtonGroup gap="loose" fullWidth="true">
              <Button>Cancel</Button>
              <Button variant="primary">Save</Button>
            </ButtonGroup>
          </Card>
        </Layout.Section>
        {/* <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Resources
              </Text>
              <List>
                <List.Item>
                  <Link
                    url="https://shopify.dev/docs/apps/design-guidelines/navigation#app-nav"
                    target="_blank"
                    removeUnderline
                  >
                    App nav best practices
                  </Link>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section> */}
      </Layout>
    </Page>
  );
}

function Code({ children }) {
  return (
    <Box
      as="span"
      padding="025"
      paddingInlineStart="100"
      paddingInlineEnd="100"
      background="bg-surface-active"
      borderWidth="025"
      borderColor="border"
      borderRadius="100"
    >
      <code>{children}</code>
    </Box>
  );
}
