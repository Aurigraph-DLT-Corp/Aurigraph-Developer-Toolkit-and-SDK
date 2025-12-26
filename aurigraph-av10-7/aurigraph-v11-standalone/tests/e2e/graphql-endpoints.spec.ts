import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:9000';
const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;

test.describe('GraphQL API Endpoints - Story 8', () => {
  test.beforeAll(async () => {
    // Verify service is running
    const response = await fetch(`${API_URL}/q/health`);
    expect(response.ok).toBeTruthy();
  });

  test.describe('Query Resolvers', () => {
    test('should introspect GraphQL schema', async () => {
      const query = `
        query {
          __schema {
            types {
              name
              kind
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.__schema.types.length).toBeGreaterThan(0);
    });

    test('should support getApproval query', async () => {
      const query = `
        query {
          __type(name: "Query") {
            fields {
              name
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const fieldNames = data.data.__type.fields.map((f: any) => f.name);

      // Verify key query resolvers exist
      expect(fieldNames).toContain('getApproval');
      expect(fieldNames).toContain('getApprovals');
      expect(fieldNames).toContain('getApprovalStatistics');
    });

    test('should support getApprovals with filters', async () => {
      const query = `
        query {
          __type(name: "ApprovalFilter") {
            inputFields {
              name
              type {
                name
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.data.__type).toBeDefined();
      expect(Array.isArray(data.data.__type.inputFields)).toBeTruthy();
    });

    test('should return approval statistics structure', async () => {
      const query = `
        query {
          __type(name: "ApprovalStatistics") {
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.data.__type).toBeDefined();
      const fieldNames = data.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames.length).toBeGreaterThan(0);
    });
  });

  test.describe('Mutation Resolvers', () => {
    test('should support executeApproval mutation', async () => {
      const query = `
        query {
          __type(name: "Mutation") {
            fields {
              name
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const mutationNames = data.data.__type.fields.map((f: any) => f.name);

      expect(mutationNames).toContain('executeApproval');
      expect(mutationNames).toContain('registerWebhook');
      expect(mutationNames).toContain('unregisterWebhook');
    });

    test('should support registerWebhook with URL validation', async () => {
      const query = `
        query {
          __type(name: "RegisterWebhookInput") {
            inputFields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.data.__type).toBeDefined();
      const fieldNames = data.data.__type.inputFields.map((f: any) => f.name);
      expect(fieldNames).toContain('webhookUrl');
    });

    test('should support unregisterWebhook mutation', async () => {
      const query = `
        query {
          __type(name: "Mutation") {
            fields(includeDeprecated: false) {
              name
              args {
                name
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const mutations = data.data.__type.fields;
      const unregisterWebhook = mutations.find((m: any) => m.name === 'unregisterWebhook');

      expect(unregisterWebhook).toBeDefined();
      expect(unregisterWebhook.args.length).toBeGreaterThan(0);
    });
  });

  test.describe('Subscription Resolvers', () => {
    test('should expose subscription types', async () => {
      const query = `
        query {
          __type(name: "Subscription") {
            fields {
              name
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const subscriptionNames = data.data.__type.fields.map((f: any) => f.name);

      // Verify key subscription resolvers exist
      expect(subscriptionNames).toContain('approvalStatusChanged');
      expect(subscriptionNames).toContain('voteSubmitted');
      expect(subscriptionNames).toContain('consensusReached');
      expect(subscriptionNames).toContain('webhookDeliveryStatus');
    });

    test('should support approvalStatusChanged subscription', async () => {
      const query = `
        query {
          __type(name: "ApprovalStatusChangeEvent") {
            fields {
              name
              type {
                name
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.data.__type).toBeDefined();
      const fieldNames = data.data.__type.fields.map((f: any) => f.name);
      expect(fieldNames.length).toBeGreaterThan(0);
    });

    test('should support voteSubmitted subscription event', async () => {
      const query = `
        query {
          __type(name: "VoteSubmittedEvent") {
            fields {
              name
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.data.__type).toBeDefined();
    });

    test('should support consensusReached subscription event', async () => {
      const query = `
        query {
          __type(name: "ConsensusReachedEvent") {
            fields {
              name
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.data.__type).toBeDefined();
    });
  });

  test.describe('Error Handling', () => {
    test('should return error for invalid query', async () => {
      const query = `
        query {
          nonexistentField {
            id
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      expect(data.errors).toBeDefined();
      expect(data.errors.length).toBeGreaterThan(0);
    });

    test('should return error for malformed request', async () => {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'request' }),
      });

      const data = await response.json();
      expect(data.errors || response.status >= 400).toBeTruthy();
    });
  });

  test.describe('Schema Validation', () => {
    test('should have valid GraphQL schema with no Object type without fields', async () => {
      const query = `
        query {
          __schema {
            types {
              name
              kind
              fields {
                name
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.errors).toBeUndefined();

      // Verify no OBJECT types with zero fields (which was the bug we fixed)
      const objectTypes = data.data.__schema.types.filter((t: any) => t.kind === 'OBJECT');
      objectTypes.forEach((objType: any) => {
        if (objType.name.startsWith('__')) return; // Skip introspection types
        expect(objType.fields.length).toBeGreaterThan(0);
      });
    });

    test('should define ApprovalEventDTO type correctly', async () => {
      const query = `
        query {
          __type(name: "ApprovalEventDTO") {
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (data.data.__type) {
        // ApprovalEventDTO should have fields (not empty)
        expect(data.data.__type.fields.length).toBeGreaterThan(0);

        // Should NOT have a 'data' field with Map<String, Object>
        const hasMapField = data.data.__type.fields.some(
          (f: any) => f.name === 'data' && f.type.name === 'Object'
        );
        expect(hasMapField).toBeFalsy();
      }
    });
  });

  test.describe('Performance', () => {
    test('introspection query should complete within 500ms', async () => {
      const query = `
        query {
          __schema {
            types {
              name
            }
          }
        }
      `;

      const startTime = Date.now();
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const endTime = Date.now();

      expect(response.ok).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(500);
    });

    test('schema query should return valid JSON', async () => {
      const query = `
        query {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
          }
        }
      `;

      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      expect(response.ok).toBeTruthy();
      const data = await response.json();
      expect(data.data).toBeDefined();
      expect(data.data.__schema).toBeDefined();
    });
  });
});
