import { describe, it, expect, vi } from 'vitest';
import { AurigraphClient } from '../src/client.js';
import type { CreateTokenRequest, MintRequest } from '../src/types.js';

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

function makeClient(fetchImpl: typeof fetch, opts: { apiKey?: string } = {}) {
  return new AurigraphClient({
    baseUrl: 'https://dlt.aurigraph.io',
    fetchImpl,
    maxRetries: 1,
    autoIdempotency: false,
    apiKey: opts.apiKey,
  });
}

describe('TokenRegistryApi', () => {
  it('T1: list() with filter builds the correct query string', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          content: [
            {
              id: 'token-home-channel-agld-001',
              tokenType: 'PRIMARY',
              status: 'ACTIVE',
              name: 'Aurigraph Gold Token',
              symbol: 'AGLD',
              totalSupply: 10_000_000,
              decimals: 18,
            },
          ],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        },
      },
    ]);
    const client = makeClient(fetchImpl);

    const page = await client.registries.tokens.list({
      standard: 'PRIMARY',
      active: true,
      page: 0,
      size: 20,
    });

    expect(page.content).toHaveLength(1);
    expect(page.content[0].symbol).toBe('AGLD');
    expect(page.totalElements).toBe(1);

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const url = calls[0][0] as string;
    expect(url).toContain('/api/v11/registries/tokens');
    expect(url).toContain('standard=PRIMARY');
    expect(url).toContain('active=true');
    expect(url).toContain('page=0');
    expect(url).toContain('size=20');
  });

  it('T2: get(tokenId) returns the token detail', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          id: 'token-home-channel-acar-002',
          channelId: 'home-channel',
          tokenType: 'PRIMARY',
          status: 'ACTIVE',
          name: 'Aurigraph Carbon Credit',
          symbol: 'ACAR',
          totalSupply: 50_000_000,
          decimals: 18,
          metadata: { backing: 'carbon-offset', vintage: '2025' },
        },
      },
    ]);
    const client = makeClient(fetchImpl);

    const token = await client.registries.tokens.get('token-home-channel-acar-002');

    expect(token.id).toBe('token-home-channel-acar-002');
    expect(token.symbol).toBe('ACAR');
    expect(token.metadata?.vintage).toBe('2025');

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe(
      'https://dlt.aurigraph.io/api/v11/registries/tokens/token-home-channel-acar-002',
    );
    expect((calls[0][1] as RequestInit).method).toBe('GET');
  });

  it('T3: create() POSTs the request body and returns the new token', async () => {
    // V12 resource wraps in { token, merkleRootHash, leafIndex } — helper unwraps.
    const fetchImpl = mockFetch([
      {
        status: 201,
        body: {
          token: {
            id: 'token-home-channel-abc12345',
            channelId: 'home-channel',
            tokenType: 'UTILITY',
            status: 'CREATED',
            name: 'My Utility Token',
            symbol: 'MUT',
            totalSupply: 1000,
            decimals: 18,
          },
          merkleRootHash: 'deadbeef',
          leafIndex: 42,
        },
      },
    ]);
    const client = makeClient(fetchImpl, { apiKey: 'test-key' });

    const req: CreateTokenRequest = {
      tokenType: 'UTILITY',
      name: 'My Utility Token',
      symbol: 'MUT',
      totalSupply: 1000,
      decimals: 18,
    };
    const token = await client.registries.tokens.create(req);

    expect(token.id).toBe('token-home-channel-abc12345');
    expect(token.symbol).toBe('MUT');
    expect(token.status).toBe('CREATED');

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/registries/tokens');
    const init = calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    const sent = JSON.parse(init.body as string);
    expect(sent.symbol).toBe('MUT');
    expect(sent.tokenType).toBe('UTILITY');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('test-key');
  });

  it('T4: mint() attaches Idempotency-Key and POSTs amount + recipient', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          tokenId: 'my-token-001',
          amount: 1000,
          recipient: '0xrecipient',
          newTotalSupply: 11_000,
          merkleRootHash: 'cafef00d',
          timestamp: '2026-04-06T00:00:00Z',
        },
      },
    ]);
    // autoIdempotency true so the client auto-attaches the header on POST.
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      autoIdempotency: true,
      apiKey: 'mint-key',
    });

    const req: MintRequest = {
      toAddress: '0xrecipient',
      amount: 1000,
      metadata: { invoiceId: 'INV-42' },
    };
    const receipt = await client.registries.tokens.mint('my-token-001', req);

    expect(receipt.tokenId).toBe('my-token-001');
    expect(receipt.amount).toBe(1000);
    expect(receipt.newTotalSupply).toBe(11_000);

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe(
      'https://dlt.aurigraph.io/api/v11/registries/tokens/my-token-001/mint',
    );
    const init = calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBeTruthy();
    expect(headers['Idempotency-Key'].length).toBeGreaterThan(8);

    const sent = JSON.parse(init.body as string);
    expect(sent.amount).toBe(1000);
    expect(sent.recipient).toBe('0xrecipient'); // toAddress → recipient mapping
    expect(sent.metadata).toEqual({ invoiceId: 'INV-42' });
  });

  it('T5: stats() aggregates token counts client-side from list()', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          content: [
            { id: 't1', tokenType: 'PRIMARY', status: 'ACTIVE', name: 'A', symbol: 'A', totalSupply: 100 },
            { id: 't2', tokenType: 'PRIMARY', status: 'ACTIVE', name: 'B', symbol: 'B', totalSupply: 200 },
            { id: 't3', tokenType: 'UTILITY', status: 'PAUSED', name: 'C', symbol: 'C', totalSupply: 50 },
          ],
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        },
      },
    ]);
    const client = makeClient(fetchImpl);

    const stats = await client.registries.tokens.stats();

    expect(stats.totalTokens).toBe(3);
    expect(stats.activeTokens).toBe(2);
    expect(stats.totalSupply).toBe('350');
    expect(stats.byType.PRIMARY).toBe(2);
    expect(stats.byType.UTILITY).toBe(1);
  });
});
