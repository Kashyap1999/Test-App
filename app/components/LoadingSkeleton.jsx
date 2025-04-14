// app/components/LoadingSkeleton.jsx
import { useNavigation } from "@remix-run/react";
import {
  Card,
  Layout,
  Page,
  SkeletonBodyText,
  SkeletonDisplayText,
  Spinner,
} from "@shopify/polaris";

const LoadingSkeleton = () => {
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  if (!isLoading) return null;

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <SkeletonDisplayText size="medium" />
            <br />
            <SkeletonBodyText lines={2} />
            {/* <SkeletonDisplayText size="large" /> */}
          </Card>
          <br />
          <Card>
            {/* <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Spinner accessibilityLabel="Loading content" size="large" />
            </div> */}
            <br />
            <SkeletonBodyText lines={5} />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
};

export default LoadingSkeleton;
