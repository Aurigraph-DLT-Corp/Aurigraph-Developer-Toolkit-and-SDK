import { describe, it, expect, vi } from 'vitest';
import { AurigraphClient } from '../../src/client.js';
import { AurigraphClientError, AurigraphServerError } from '../../src/errors.js';
import type {
  ProvenewsAsset,
  ProvenewsAssetRegisterRequest,
  ProvenewsMerkleProof,
  ProvenewsCheckpoint,
  ProvenewsOrg,
  ProvenewsCompositeToken,
  ProvenewsCompositeAssembleRequest,
  ProvenewsTokenVerification,
  ProvenewsDevice,
  ProvenewsDeviceRegisterRequest,
  ProvenewsTokenizationNode,
  ProvenewsAssignValidatorsRequest,
  ProvenewsTokenizationStatus,
  ProvenewsContract,
  ProvenewsContractCreateRequest,
  ProvenewsRevenueEvent,
  ProvenewsRevenueRequest,
} from '../../src/types.js';

const VALID_HASH = 'a'.repeat(64);
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

function mockFetch(responses: Array<{ body: unknown; status: number }>) {
  const fn = vi.fn();
  for (const r of responses) {
    const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    fn.mockResolvedValueOnce({
      status: r.status,
      statusText: r.status >= 200 && r.status < 300 ? 'OK' : 'Error',
      ok: r.status >= 200 && r.status < 300,
      text: async () => text,
      json: async () => JSON.parse(text),
    } as Response);
  }
  return fn as unknown as typeof fetch;
}

function makeClient(fetchImpl: typeof fetch) {
  return new AurigraphClient({
    baseUrl: 'https://dlt.aurigraph.io',
    fetchImpl,
    maxRetries: 1,
    autoIdempotency: false,
    apiKey: 'test-key',
  });
}

function getCalls(fetchImpl: typeof fetch) {
  return (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
}

describe('ProvenewsExtended — all Provenews endpoints via AurigraphClient', () => {
  // ══════════════════════════════════════════════════════════════════════════
  // CONTRACTS
  // ══════════════════════════════════════════════════════════════════════════

  it('T1: contracts() calls GET /provenews/contracts and unwraps array', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          contracts: [
            {
              contractId: VALID_UUID,
              title: 'Photo License',
              documentType: 'COMMERCIAL',
              createdAt: '2026-04-07T00:00:00Z',
              status: 'ACTIVE',
            },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const contracts = await client.registries.provenews.contracts();

    expect(contracts).toHaveLength(1);
    expect(contracts[0].contractId).toBe(VALID_UUID);
    expect(contracts[0].title).toBe('Photo License');

    const calls = getCalls(fetchImpl);
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/provenews/contracts');
    expect((calls[0][1] as RequestInit).method).toBe('GET');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ASSETS
  // ══════════════════════════════════════════════════════════════════════════

  it('T2: assets() calls GET /provenews/ledger/assets and unwraps array', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          assets: [
            {
              id: 'asset-001',
              assetType: 'PRIMARY',
              contentHash: VALID_HASH,
              ownerId: 'owner-1',
              status: 'REGISTERED',
              createdAt: '2026-04-07T00:00:00Z',
            },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const assets = await client.registries.provenews.assets();

    expect(assets).toHaveLength(1);
    expect(assets[0].id).toBe('asset-001');

    const calls = getCalls(fetchImpl);
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/provenews/ledger/assets');
    expect((calls[0][1] as RequestInit).method).toBe('GET');
  });

  it('T3: empty assets response returns empty array', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { assets: [] } },
    ]);
    const client = makeClient(fetchImpl);
    const assets = await client.registries.provenews.assets();
    expect(assets).toEqual([]);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ERROR HANDLING
  // ══════════════════════════════════════════════════════════════════════════

  it('T4: 404 on contracts throws AurigraphClientError', async () => {
    const fetchImpl = mockFetch([
      {
        status: 404,
        body: {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'contract not found',
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    await expect(client.registries.provenews.contracts()).rejects.toBeInstanceOf(
      AurigraphClientError,
    );
    expect(getCalls(fetchImpl).length).toBe(1);
  });

  it('T5: 503 on assets throws AurigraphServerError', async () => {
    const fetchImpl = mockFetch([
      {
        status: 503,
        body: { type: 'about:blank', title: 'Unavailable', status: 503 },
      },
    ]);
    const client = makeClient(fetchImpl);
    await expect(client.registries.provenews.assets()).rejects.toBeInstanceOf(
      AurigraphServerError,
    );
  });

  // ══════════════════════════════════════════════════════════════════════════
  // HEADERS
  // ══════════════════════════════════════════════════════════════════════════

  it('T6: API key header is sent on provenews requests', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { contracts: [] } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      apiKey: 'pn-api-key',
    });
    await client.registries.provenews.contracts();

    const headers = (getCalls(fetchImpl)[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('pn-api-key');
  });

  it('T7: JWT Bearer header is sent when configured', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { assets: [] } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      jwtToken: 'eyJ-provenews-jwt',
    });
    await client.registries.provenews.assets();

    const headers = (getCalls(fetchImpl)[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer eyJ-provenews-jwt');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CONTRACTS — unwrap edge cases
  // ══════════════════════════════════════════════════════════════════════════

  it('T8: contracts() handles bare array response', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: [
          { contractId: 'c-1', title: 'License A' },
          { contractId: 'c-2', title: 'License B' },
        ],
      },
    ]);
    const client = makeClient(fetchImpl);
    const contracts = await client.registries.provenews.contracts();
    expect(contracts).toHaveLength(2);
  });

  it('T9: contracts() handles "items" envelope', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          items: [{ contractId: 'c-3', title: 'License C' }],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const contracts = await client.registries.provenews.contracts();
    expect(contracts).toHaveLength(1);
    expect(contracts[0].contractId).toBe('c-3');
  });

  it('T10: assets() handles "content" envelope', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          content: [{ id: 'a-1', assetType: 'PRIMARY' }],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const assets = await client.registries.provenews.assets();
    expect(assets).toHaveLength(1);
    expect(assets[0].id).toBe('a-1');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RESPONSE TYPING VERIFICATION
  // ══════════════════════════════════════════════════════════════════════════

  it('T11: contracts() preserves all DTO fields', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          contracts: [
            {
              contractId: VALID_UUID,
              title: 'Music Royalty',
              documentType: 'ROYALTY',
              createdAt: '2026-04-07T08:00:00Z',
              status: 'SIGNED',
            },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const contracts = await client.registries.provenews.contracts();
    const c = contracts[0];

    expect(c.contractId).toBe(VALID_UUID);
    expect(c.title).toBe('Music Royalty');
    expect(c.documentType).toBe('ROYALTY');
    expect(c.createdAt).toBe('2026-04-07T08:00:00Z');
    expect(c.status).toBe('SIGNED');
  });

  it('T12: assets() preserves all DTO fields', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          assets: [
            {
              id: 'asset-photo-001',
              assetType: 'COMPOSITE',
              contentHash: VALID_HASH,
              ownerId: 'photographer-1',
              status: 'VERIFIED',
              createdAt: '2026-04-07T09:00:00Z',
              metadata: { camera: 'Canon EOS R5', location: 'Mumbai' },
            },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const assets = await client.registries.provenews.assets();
    const a = assets[0];

    expect(a.id).toBe('asset-photo-001');
    expect(a.assetType).toBe('COMPOSITE');
    expect(a.contentHash).toBe(VALID_HASH);
    expect(a.ownerId).toBe('photographer-1');
    expect(a.metadata).toEqual({ camera: 'Canon EOS R5', location: 'Mumbai' });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // MULTIPLE CONTRACTS / ASSETS
  // ══════════════════════════════════════════════════════════════════════════

  it('T13: contracts() returns multiple contracts', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          contracts: [
            { contractId: 'c-1', title: 'A' },
            { contractId: 'c-2', title: 'B' },
            { contractId: 'c-3', title: 'C' },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const contracts = await client.registries.provenews.contracts();
    expect(contracts).toHaveLength(3);
    expect(contracts.map((c: Record<string, unknown>) => c.contractId)).toEqual([
      'c-1',
      'c-2',
      'c-3',
    ]);
  });

  it('T14: assets() returns multiple assets with mixed types', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          assets: [
            { id: 'a-1', assetType: 'PRIMARY' },
            { id: 'a-2', assetType: 'SECONDARY' },
            { id: 'a-3', assetType: 'COMPOSITE' },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const assets = await client.registries.provenews.assets();
    expect(assets).toHaveLength(3);
    expect(assets.map((a: Record<string, unknown>) => a.assetType)).toEqual([
      'PRIMARY',
      'SECONDARY',
      'COMPOSITE',
    ]);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // NULL / EMPTY RESPONSES
  // ══════════════════════════════════════════════════════════════════════════

  it('T15: contracts() handles null body gracefully', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: {} },
    ]);
    const client = makeClient(fetchImpl);
    const contracts = await client.registries.provenews.contracts();
    expect(contracts).toEqual([]);
  });

  it('T16: Accept header is application/json', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { contracts: [] } },
    ]);
    const client = makeClient(fetchImpl);
    await client.registries.provenews.contracts();

    const headers = (getCalls(fetchImpl)[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Accept']).toBe('application/json');
  });
});
