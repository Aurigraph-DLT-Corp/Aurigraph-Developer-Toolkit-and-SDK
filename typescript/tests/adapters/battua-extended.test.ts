import { describe, it, expect, vi } from 'vitest';
import { AurigraphClient } from '../../src/client.js';
import { AurigraphClientError, AurigraphServerError } from '../../src/errors.js';

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

function makeClient(fetchImpl: typeof fetch, opts: { apiKey?: string; jwtToken?: string } = {}) {
  return new AurigraphClient({
    baseUrl: 'https://dlt.aurigraph.io',
    fetchImpl,
    maxRetries: 1,
    autoIdempotency: false,
    apiKey: opts.apiKey ?? 'test-key',
    jwtToken: opts.jwtToken,
  });
}

describe('BattuaExtended — registries.battua via AurigraphClient', () => {
  // ── T1: GET /registries/battua — list tokens ─────────────────────────────

  it('T1: tokens() calls GET /registries/battua and unwraps tokens array', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          tokens: [
            {
              tokenId: 'battua-usdt-001',
              symbol: 'USDT',
              name: 'Tether',
              decimals: 6,
              totalSupply: '1000000000',
              issuer: 'aurigraph',
            },
            {
              tokenId: 'battua-usdc-002',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              totalSupply: '500000000',
            },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const tokens = await client.registries.battua.tokens();

    expect(tokens).toHaveLength(2);
    expect(tokens[0].tokenId).toBe('battua-usdt-001');
    expect(tokens[0].symbol).toBe('USDT');
    expect(tokens[1].symbol).toBe('USDC');

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const url = calls[0][0] as string;
    expect(url).toBe('https://dlt.aurigraph.io/api/v11/registries/battua');
    expect((calls[0][1] as RequestInit).method).toBe('GET');
  });

  // ── T2: GET /registries/battua — stats endpoint ──────────────────────────

  it('T2: stats() calls GET /registries/battua and returns raw stats object', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          totalNodes: 5,
          activeNodes: 3,
          averageUptimeMs: 86400000,
          tokens: [],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const stats = await client.registries.battua.stats();

    expect(stats.totalNodes).toBe(5);
    expect(stats.activeNodes).toBe(3);

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/registries/battua');
  });

  // ── T3: GET /registries/battua-nodes — list nodes ────────────────────────

  it('T3: nodes() calls GET /registries/battua-nodes and unwraps nodes array', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          nodes: [
            {
              nodeId: 'battua-node-1',
              nodeLabel: 'Mumbai Gateway',
              lastHeartbeat: '2026-04-07T10:00:00Z',
              version: '2.2.0',
              status: 'ACTIVE',
            },
          ],
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const nodes = await client.registries.battua.nodes();

    expect(nodes).toHaveLength(1);
    expect(nodes[0].nodeId).toBe('battua-node-1');
    expect(nodes[0].status).toBe('ACTIVE');

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/registries/battua-nodes');
    expect((calls[0][1] as RequestInit).method).toBe('GET');
  });

  // ── T4: POST /registries/battua-nodes/register — node heartbeat ──────────

  it('T4: registerNodeHeartbeat() POSTs body to /registries/battua-nodes/register', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          nodeId: 'battua-node-1',
          lastHeartbeat: '2026-04-07T12:00:00Z',
          status: 'ACTIVE',
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    const result = await client.registries.battua.registerNodeHeartbeat({
      nodeId: 'battua-node-1',
      lastHeartbeat: '2026-04-07T12:00:00Z',
    });

    expect(result.nodeId).toBe('battua-node-1');
    expect(result.status).toBe('ACTIVE');

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const url = calls[0][0] as string;
    expect(url).toBe('https://dlt.aurigraph.io/api/v11/registries/battua-nodes/register');
    const init = calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body as string);
    expect(sent.nodeId).toBe('battua-node-1');
    expect(sent.lastHeartbeat).toBe('2026-04-07T12:00:00Z');
  });

  // ── T5: API key is attached to GET requests ──────────────────────────────

  it('T5: API key header is attached to battua GET requests', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { tokens: [] } },
    ]);
    const client = makeClient(fetchImpl, { apiKey: 'my-battua-key' });
    await client.registries.battua.tokens();

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const headers = (calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('my-battua-key');
  });

  // ── T6: 4xx error does not retry ─────────────────────────────────────────

  it('T6: 400 on battua tokens throws AurigraphClientError without retry', async () => {
    const fetchImpl = mockFetch([
      {
        status: 400,
        body: {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'invalid registry query',
          errorCode: 'REGISTRY_INVALID',
        },
      },
    ]);
    const client = makeClient(fetchImpl);
    await expect(client.registries.battua.tokens()).rejects.toBeInstanceOf(AurigraphClientError);
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  // ── T7: 5xx error throws AurigraphServerError ────────────────────────────

  it('T7: 503 on battua stats throws AurigraphServerError', async () => {
    const fetchImpl = mockFetch([
      {
        status: 503,
        body: { type: 'about:blank', title: 'Unavailable', status: 503 },
      },
    ]);
    const client = makeClient(fetchImpl);
    await expect(client.registries.battua.stats()).rejects.toBeInstanceOf(AurigraphServerError);
  });

  // ── T8: Empty tokens response returns empty array ────────────────────────

  it('T8: empty tokens envelope returns empty array', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { tokens: [] } },
    ]);
    const client = makeClient(fetchImpl);
    const tokens = await client.registries.battua.tokens();
    expect(tokens).toEqual([]);
  });

  // ── T9: JWT token sent as Authorization header ───────────────────────────

  it('T9: JWT token is sent as Bearer Authorization header', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { nodes: [] } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      jwtToken: 'eyJ-battua-jwt',
    });
    await client.registries.battua.nodes();

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const headers = (calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer eyJ-battua-jwt');
  });

  // ── T10: Heartbeat POST includes Content-Type JSON ───────────────────────

  it('T10: POST registerNodeHeartbeat sets Content-Type application/json', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { nodeId: 'n1', status: 'ACTIVE' } },
    ]);
    const client = makeClient(fetchImpl);
    await client.registries.battua.registerNodeHeartbeat({
      nodeId: 'n1',
      lastHeartbeat: new Date().toISOString(),
    });

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const headers = (calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });
});
