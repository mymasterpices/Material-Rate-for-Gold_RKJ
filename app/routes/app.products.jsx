import { useLoaderData } from "@remix-run/react";
import { Card, Layout, Page, Spinner } from "@shopify/polaris";
import { json } from "@remix-run/node";
import { apiVersion, authenticate } from "~/shopify.server";

const query = `
  query($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "tag:Gold_22K") {
      edges {
        node {
          id
          title
          tags
          priceRange {
            minVariantPrice {
              amount
            }
          }
            
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop, accessToken } = session;

  let allProducts = [];
  let hasNextPage = true;
  let endCursor = null;

  try {
    while (hasNextPage) {
      const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({
          query,
          variables: { first: 50, after: endCursor },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const { data } = await response.json();
      const { edges, pageInfo } = data.products;

      allProducts = [...allProducts, ...edges];
      hasNextPage = pageInfo.hasNextPage;
      endCursor = pageInfo.endCursor;
    }

    return json({ products: allProducts });
  } catch (err) {
    console.error(err);
    return json({ products: [], error: err.message });
  }
};

const Products = () => {
  const { products, error } = useLoaderData();

  if (error) {
    return <Page title="Products with Tag 'Gold_22K'"><p>Error: {error}</p></Page>;
  }

  if (!products) {
    return <Page title="Products with Tag 'Gold_22K'"><Spinner /></Page>;
  }

  return (
    <Page title="Products with Tag 'Gold_22K'">
      <Layout>
        {products.length > 0 ? (
          products.map(({ node }) => (
            <Layout.Section key={node.id}>
              <Card>
                <h1>{node.title}</h1>
                <p>Price: {node.priceRange.minVariantPrice.amount}</p>
              </Card>
            </Layout.Section>
          ))
        ) : (
          <p>No products found with the tag 'Gold_22K'.</p>
        )}
      </Layout>
    </Page>
  );
};

export default Products;
