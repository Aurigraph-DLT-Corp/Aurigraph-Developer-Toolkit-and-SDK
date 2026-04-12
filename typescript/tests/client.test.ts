import { describe, it, expect, vi } from 'vitest';
import { AurigraphClient } from '../src/client.js';
import {
  AurigraphClientError,
  AurigraphConfigError,
  AurigraphServerError,
} from '../src/errors.js';

function mockFetch(responses: Array<Partial<Response> & { body: unknown; status: number }>) {
  const fn = vi.fn();
  for (const r of responses) {
    const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    fn.mockResolvedValueOnce({
      status: r.status,
      statusText: r.status === 200 ? 'OK' : 'Error',
      ok: r.status >= 200 && r.status < 300,
      text: async () => text,
      json: async () => JSON.parse(text),
    } as Response);
  }
  return fn as unknown as typeof fetch;
}

describe('AurigraphClient', () => {
  it('throws AurigraphConfigError when baseUrl is missing', () => {
    expect(() => new AurigraphClient({ baseUrl: '' })).toThrow(AurigraphConfigError);
  });

  it('fetches health endpoint with correct URL and headers', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { status: 'HEALTHY', durationMs: 8 } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      apiKey: 'test-key',
      fetchImpl,
      maxRetries: 1,
    });
    const health = await client.health.get();
    expect(health.status).toBe('HEALTHY');
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/health');
    const init = calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('test-key');
  });

  it('submits transaction via POST with JSON body', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { txHash: '0xabc', status: 'PENDING' } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      jwtToken: 'eyJ-fake',
      fetchImpl,
      maxRetries: 1,
    });
    const receipt = await client.transactions.submit({
      fromAddress: '0xaaa',
      toAddress: '0xbbb',
      amount: '100',
      asset: 'USDT',
    });
    expect(receipt.txHash).toBe('0xabc');
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const init = calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer eyJ-fake');
    expect(JSON.parse(init.body as string).fromAddress).toBe('0xaaa');
  });

  it('throws AurigraphClientError on 4xx without retry', async () => {
    const fetchImpl = mockFetch([
      {
        status: 400,
        body: {
          type: 'about:blank',
          title: 'Bad Request',
          status: 400,
          detail: 'invalid nodeId',
          errorCode: 'NODE_INVALID',
        },
      },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 3,
    });
    await expect(client.nodes.get('bad-id')).rejects.toBeInstanceOf(AurigraphClientError);
    // 4xx = exactly 1 call, no retries
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  it('retries on 5xx and eventually throws AurigraphServerError', async () => {
    const fetchImpl = mockFetch([
      { status: 503, body: { type: 'about:blank', title: 'Unavailable', status: 503 } },
      { status: 503, body: { type: 'about:blank', title: 'Unavailable', status: 503 } },
      { status: 503, body: { type: 'about:blank', title: 'Unavailable', status: 503 } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 3,
    });
    await expect(client.stats.get()).rejects.toBeInstanceOf(AurigraphServerError);
    expect((fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.length).toBe(3);
  });

  it('unwraps list envelope for channels.list()', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: { channels: [{ channelId: 'c1', name: 'home', type: 'HOME' }] },
      },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
    });
    const channels = await client.channels.list();
    expect(channels).toHaveLength(1);
    expect(channels[0].channelId).toBe('c1');
  });
});
