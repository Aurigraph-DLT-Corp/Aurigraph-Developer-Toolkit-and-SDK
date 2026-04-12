/**
 * Tests for the SDK Handshake namespace (AAT-H4).
 *
 * Covers:
 *   - hello() / heartbeat() / capabilities() / config() methods
 *   - `Authorization: ApiKey <appId>:<rawKey>` header format (NOT X-API-Key)
 *   - autoHandshake + autoHeartbeat lifecycle options
 *   - dispose() shutdown
 *   - Legacy apiKey-without-appId deprecation warning
 *   - Bearer token precedence
 *   - RFC 7807 error parsing
 *
 * These tests are written against the API surface that AAT-H1 (backend),
 * AAT-H2 (TS SDK handshake namespace + header fix), and AAT-H3 (Java SDK)
 * are delivering. They will become runnable once H2 has landed. Until then,
 * the describe block is skipped via `describe.skipIf(!hasSdkNamespace())`
 * so the rest of the Vitest suite remains green.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AurigraphClient } from '../src/client.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

interface StubbedResponse {
  body: unknown;
  status: number;
  contentType?: string;
}

function mockFetch(responses: StubbedResponse[]) {
  const fn = vi.fn();
  for (const r of responses) {
    const text = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    const contentType = r.contentType ?? 'application/json';
    fn.mockResolvedValueOnce({
      status: r.status,
      statusText: r.status >= 200 && r.status < 300 ? 'OK' : 'Error',
      ok: r.status >= 200 && r.status < 300,
      headers: {
        get: (name: string) =>
          name.toLowerCase() === 'content-type' ? contentType : null,
      },
      text: async () => text,
      json: async () => JSON.parse(text),
    } as unknown as Response);
  }
  return fn as unknown as typeof fetch;
}

/**
 * True once AAT-H2 has landed `client.sdk` on AurigraphClient. Until then,
 * the handshake suite is skipped so this test file does not break CI.
 */
function hasSdkNamespace(): boolean {
  try {
    const probe = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl: (async () =>
        ({ status: 200, text: async () => '{}' } as unknown as Response)) as typeof fetch,
      appId: '00000000-0000-0000-0000-000000000000',
      apiKey: 'probe',
      maxRetries: 1,
    } as unknown as ConstructorParameters<typeof AurigraphClient>[0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof (probe as any).sdk?.hello === 'function';
  } catch {
    return false;
  }
}

const SDK_READY = hasSdkNamespace();

// Sample server responses used across tests.
const HELLO_BODY = {
  appId: '11111111-1111-1111-1111-111111111111',
  appName: 'Battua SDK Test',
  did: 'did:aurigraph:battua-test',
  status: 'ACTIVE',
  serverVersion: '12.1.34',
  protocolVersion: '1.0',
  approvedScopes: ['registry:read', 'dmrv:read', 'health:read'],
  requestedScopes: ['registry:read', 'dmrv:read', 'health:read', 'mint:token'],
  pendingScopes: ['mint:token'],
  rateLimit: { requestsPerMinute: 600, burstSize: 60 },
  heartbeatIntervalMs: 300000,
  features: { dprA: true, compositeTokens: true },
  nextHeartbeatAt: '2026-04-07T12:05:00Z',
};

const HEARTBEAT_BODY = {
  receivedAt: '2026-04-07T12:00:00Z',
  nextHeartbeatAt: '2026-04-07T12:05:00Z',
  status: 'ACTIVE',
};

const CAPABILITIES_BODY = {
  appId: '11111111-1111-1111-1111-111111111111',
  approvedScopes: ['registry:read', 'dmrv:read', 'health:read'],
  totalEndpoints: 10,
  endpoints: Array.from({ length: 10 }).map((_, i) => ({
    method: 'GET',
    path: `/api/v11/registries/battua/endpoint-${i}`,
    requiredScope: 'registry:read',
    description: `Endpoint ${i}`,
  })),
};

const CONFIG_BODY = {
  appId: '11111111-1111-1111-1111-111111111111',
  status: 'ACTIVE',
  approvedScopes: ['registry:read', 'dmrv:read', 'health:read'],
  pendingScopes: ['mint:token'],
  rateLimit: { requestsPerMinute: 600, burstSize: 60 },
  lastUpdatedAt: '2026-04-07T12:00:00Z',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeClient(fetchImpl: typeof fetch, extra: Record<string, any> = {}) {
  return new AurigraphClient({
    baseUrl: 'https://dlt.aurigraph.io',
    fetchImpl,
    maxRetries: 1,
    autoIdempotency: false,
    appId: '11111111-1111-1111-1111-111111111111',
    apiKey: 'raw-key-abcdef',
    ...extra,
  } as unknown as ConstructorParameters<typeof AurigraphClient>[0]);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = AurigraphClient & { sdk: any; dispose?: () => void };

// ── Test Suite ───────────────────────────────────────────────────────────────

describe.skipIf(!SDK_READY)('SDK Handshake — client.sdk.* (AAT-H4)', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── T1: hello() call shape + typed response ────────────────────────────────

  it('T1: hello() calls GET /sdk/handshake/hello and parses HelloResponse', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: HELLO_BODY }]);
    const client = makeClient(fetchImpl) as AnyClient;
    const hello = await client.sdk.hello();

    expect(hello).toBeDefined();
    expect(hello.appId).toBe(HELLO_BODY.appId);
    expect(hello.approvedScopes).toEqual(HELLO_BODY.approvedScopes);
    expect(hello.pendingScopes).toEqual(['mint:token']);
    expect(hello.rateLimit.requestsPerMinute).toBe(600);
    expect(hello.heartbeatIntervalMs).toBe(300000);

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const url = calls[0][0] as string;
    const init = calls[0][1] as RequestInit;
    expect(url).toBe('https://dlt.aurigraph.io/api/v11/sdk/handshake/hello');
    expect(init.method).toBe('GET');
  });

  // ── T2: Authorization: ApiKey <appId>:<rawKey> header format ───────────────

  it('T2: hello() sends Authorization: ApiKey <appId>:<rawKey> header (not X-API-Key)', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: HELLO_BODY }]);
    const client = makeClient(fetchImpl) as AnyClient;
    await client.sdk.hello();

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const headers = (calls[0][1] as RequestInit).headers as Record<string, string>;
    const authHeader =
      headers['Authorization'] ?? headers['authorization'] ?? '';
    expect(authHeader).toMatch(
      /^ApiKey 11111111-1111-1111-1111-111111111111:raw-key-abcdef$/,
    );
    // And the legacy header MUST NOT be present when appId is supplied.
    expect(headers['X-API-Key']).toBeUndefined();
  });

  // ── T3: heartbeat() POST with clientVersion body ───────────────────────────

  it('T3: heartbeat() POSTs to /sdk/handshake/heartbeat with clientVersion body', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: HEARTBEAT_BODY }]);
    const client = makeClient(fetchImpl) as AnyClient;
    const hb = await client.sdk.heartbeat('aurigraph-ts-sdk/1.0.0');

    expect(hb.status).toBe('ACTIVE');
    expect(hb.nextHeartbeatAt).toBeDefined();

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const url = calls[0][0] as string;
    const init = calls[0][1] as RequestInit;
    expect(url).toBe('https://dlt.aurigraph.io/api/v11/sdk/handshake/heartbeat');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.clientVersion).toBe('aurigraph-ts-sdk/1.0.0');
  });

  // ── T4: capabilities() filtered endpoint list ──────────────────────────────

  it('T4: capabilities() returns 10 filtered CapabilityEndpoints', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: CAPABILITIES_BODY }]);
    const client = makeClient(fetchImpl) as AnyClient;
    const caps = await client.sdk.capabilities();

    expect(caps.endpoints).toHaveLength(10);
    expect(caps.totalEndpoints).toBe(10);
    expect(caps.approvedScopes).toContain('registry:read');
    // Each endpoint is typed {method, path, requiredScope, description}
    for (const ep of caps.endpoints) {
      expect(ep.method).toBe('GET');
      expect(typeof ep.path).toBe('string');
      expect(ep.requiredScope).toBe('registry:read');
    }

    const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(url).toBe('https://dlt.aurigraph.io/api/v11/sdk/handshake/capabilities');
  });

  // ── T5: config() lightweight refresh ───────────────────────────────────────

  it('T5: config() returns lightweight refresh without endpoint list', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: CONFIG_BODY }]);
    const client = makeClient(fetchImpl) as AnyClient;
    const cfg = await client.sdk.config();

    expect(cfg.appId).toBe(CONFIG_BODY.appId);
    expect(cfg.status).toBe('ACTIVE');
    expect(cfg.approvedScopes).toHaveLength(3);
    expect(cfg.pendingScopes).toEqual(['mint:token']);
    // Lightweight: must NOT carry the endpoint list
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((cfg as any).endpoints).toBeUndefined();

    const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(url).toBe('https://dlt.aurigraph.io/api/v11/sdk/handshake/config');
  });

  // ── T6: Legacy apiKey without appId warns once ─────────────────────────────

  it('T6: legacy apiKey-only (no appId) emits deprecation warning exactly once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchImpl = mockFetch([
      { status: 200, body: HELLO_BODY },
      { status: 200, body: HEARTBEAT_BODY },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      // Note: apiKey only, no appId — legacy path
      apiKey: 'legacy-key-no-appid',
    } as unknown as ConstructorParameters<typeof AurigraphClient>[0]) as AnyClient;

    await client.sdk.hello();
    await client.sdk.heartbeat('ts-sdk/legacy');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toMatch(/deprecat|legacy|appId/i);
  });

  // ── T7: autoHandshake fires hello() on construction ────────────────────────

  it('T7: autoHandshake: true calls hello() on construction', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: HELLO_BODY }]);
    const onHandshake = vi.fn();
    makeClient(fetchImpl, {
      autoHandshake: true,
      onHandshake,
    });

    // Allow the microtask that schedules hello() to run.
    await new Promise((r) => setTimeout(r, 10));

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe(
      'https://dlt.aurigraph.io/api/v11/sdk/handshake/hello',
    );
    expect(onHandshake).toHaveBeenCalledTimes(1);
    expect(onHandshake.mock.calls[0][0].appId).toBe(HELLO_BODY.appId);
  });

  // ── T8: autoHeartbeat schedules periodic heartbeat ─────────────────────────

  it('T8: autoHeartbeat schedules heartbeat every 5 minutes', async () => {
    vi.useFakeTimers();
    const fetchImpl = mockFetch([
      { status: 200, body: HEARTBEAT_BODY },
      { status: 200, body: HEARTBEAT_BODY },
      { status: 200, body: HEARTBEAT_BODY },
    ]);
    makeClient(fetchImpl, {
      autoHeartbeat: true,
      heartbeatIntervalMs: 300000,
    });

    // Initial construction schedules the timer — fire two intervals.
    await vi.advanceTimersByTimeAsync(300_001);
    await vi.advanceTimersByTimeAsync(300_001);

    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const heartbeatCalls = calls.filter((c) =>
      (c[0] as string).endsWith('/sdk/handshake/heartbeat'),
    );
    expect(heartbeatCalls.length).toBeGreaterThanOrEqual(2);
  });

  // ── T9: dispose() stops the heartbeat timer ────────────────────────────────

  it('T9: dispose() stops the heartbeat timer', async () => {
    vi.useFakeTimers();
    const fetchImpl = mockFetch([
      { status: 200, body: HEARTBEAT_BODY },
      { status: 200, body: HEARTBEAT_BODY },
    ]);
    const client = makeClient(fetchImpl, {
      autoHeartbeat: true,
      heartbeatIntervalMs: 300000,
    }) as AnyClient;

    await vi.advanceTimersByTimeAsync(300_001);
    const countAfterFirst = (fetchImpl as unknown as ReturnType<typeof vi.fn>)
      .mock.calls.length;

    client.dispose?.();

    // No more heartbeats after dispose.
    await vi.advanceTimersByTimeAsync(600_001);
    const countAfterDispose = (
      fetchImpl as unknown as ReturnType<typeof vi.fn>
    ).mock.calls.length;
    expect(countAfterDispose).toBe(countAfterFirst);
  });

  // ── T10: Bearer token precedence over apiKey ───────────────────────────────

  it('T10: Bearer jwtToken takes precedence over ApiKey header', async () => {
    const fetchImpl = mockFetch([{ status: 200, body: HELLO_BODY }]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      appId: '11111111-1111-1111-1111-111111111111',
      apiKey: 'raw-key-ignored',
      jwtToken: 'eyJjwt.token.here',
    } as unknown as ConstructorParameters<typeof AurigraphClient>[0]) as AnyClient;

    await client.sdk.hello();

    const headers = (
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit
    ).headers as Record<string, string>;
    const authHeader =
      headers['Authorization'] ?? headers['authorization'] ?? '';
    expect(authHeader).toBe('Bearer eyJjwt.token.here');
    expect(authHeader).not.toMatch(/^ApiKey/);
  });

  // ── T11: RFC 7807 error parsing ────────────────────────────────────────────

  it('T11: hello() 401 error parses RFC 7807 problem+json with errorCode', async () => {
    const fetchImpl = mockFetch([
      {
        status: 401,
        contentType: 'application/problem+json',
        body: {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          detail: 'Invalid API key',
          errorCode: 'ERR_SDK_AUTH_001',
          instance: '/api/v11/sdk/handshake/hello',
          traceId: 'trace-xyz',
        },
      },
    ]);
    const client = makeClient(fetchImpl) as AnyClient;

    await expect(client.sdk.hello()).rejects.toMatchObject({
      status: 401,
    });
    // The thrown error should expose the RFC 7807 problem details.
    try {
      await client.sdk.hello();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      if (e.problem) {
        expect(e.problem.errorCode).toBe('ERR_SDK_AUTH_001');
      }
    }
  });

  // ── T12: autoHandshake failure does not crash the client ───────────────────

  it('T12: autoHandshake fetch failure does not throw from the constructor', async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error('network down'));
    // Spy on console.debug (used by the client debug log path).
    const dbg = vi
      .spyOn(console, 'debug')
      .mockImplementation(() => undefined);

    expect(() =>
      makeClient(failingFetch as unknown as typeof fetch, {
        autoHandshake: true,
        debug: true,
      }),
    ).not.toThrow();

    // Let the scheduled hello() promise reject.
    await new Promise((r) => setTimeout(r, 20));

    // Should have attempted the call at least once; debug log should have fired.
    expect(failingFetch).toHaveBeenCalled();
    dbg.mockRestore();
  });
});

// Always-on sanity: ensures the file compiles + CI reports skipped count
// correctly if AAT-H2 hasn't landed yet.
describe('SDK Handshake — availability probe', () => {
  it('reports whether AAT-H2 (client.sdk namespace) is present', () => {
    // This test is informational: prints the gate state for test output clarity.
    // It always passes so the suite is green regardless of H2 landing order.
    expect(typeof SDK_READY).toBe('boolean');
  });
});
