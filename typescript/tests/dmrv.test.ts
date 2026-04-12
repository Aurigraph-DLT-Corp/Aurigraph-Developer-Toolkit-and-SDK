import { describe, it, expect, vi } from 'vitest';
import { AurigraphClient } from '../src/client.js';
import { DMRV_BATCH_CHUNK_SIZE } from '../src/namespaces/dmrv.js';
import type { DmrvEvent } from '../src/types.js';

function mockFetch(responses: Array<{ body: unknown; status: number }>) {
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

const VALID_UUID = '11111111-2222-4333-8444-555555555555';

describe('DmrvApi', () => {
  it('T1: recordEvent posts to /dmrv/events and returns receipt', async () => {
    const fetchImpl = mockFetch([
      { status: 200, body: { eventId: 'evt-1', status: 'ACCEPTED', txHash: '0xaaa' } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      autoIdempotency: false,
    });
    const receipt = await client.dmrv.recordEvent({
      deviceId: 'device-123',
      eventType: 'BATTERY_SWAP',
      quantity: 1,
    } as DmrvEvent);
    expect(receipt.eventId).toBe('evt-1');
    expect(receipt.status).toBe('ACCEPTED');
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe('https://dlt.aurigraph.io/api/v11/dmrv/events');
    const init = calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
  });

  it('T2: triggerMint with valid UUID hits the contract endpoint', async () => {
    const fetchImpl = mockFetch([
      {
        status: 200,
        body: {
          contractId: VALID_UUID,
          eventType: 'CARBON_OFFSET',
          quantity: 5,
          status: 'MINTED',
          tokenId: 'tok-9',
          txHash: '0xbbb',
        },
      },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      autoIdempotency: false,
    });
    const receipt = await client.dmrv.triggerMint(VALID_UUID, 'CARBON_OFFSET', 5);
    expect(receipt.status).toBe('MINTED');
    expect(receipt.tokenId).toBe('tok-9');
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][0]).toBe(
      `https://dlt.aurigraph.io/api/v11/active-contracts/${VALID_UUID}/trigger-mint`,
    );
  });

  it('T3: triggerMint with bad UUID throws client-side before any fetch', async () => {
    const fetchImpl = vi.fn();
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxRetries: 1,
    });
    await expect(
      client.dmrv.triggerMint('not-a-uuid', 'BATTERY_SWAP', 1),
    ).rejects.toThrow(/UUID/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('T4: batchRecord splits >50 events into chunks of 50', async () => {
    // 120 events → 3 chunks (50 + 50 + 20)
    const events: DmrvEvent[] = Array.from({ length: 120 }, (_, i) => ({
      deviceId: `d-${i}`,
      eventType: 'METER_READING',
      quantity: i,
    }));
    const fetchImpl = mockFetch([
      { status: 200, body: { accepted: 50, rejected: 0, receipts: [] } },
      { status: 200, body: { accepted: 50, rejected: 0, receipts: [] } },
      { status: 200, body: { accepted: 20, rejected: 0, receipts: [] } },
    ]);
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      fetchImpl,
      maxRetries: 1,
      autoIdempotency: false,
    });
    const result = await client.dmrv.batchRecord(events);
    expect(result.accepted).toBe(120);
    expect(result.rejected).toBe(0);
    expect(DMRV_BATCH_CHUNK_SIZE).toBe(50);
    const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.length).toBe(3);
    // Verify chunks have correct sizes
    const chunk1 = JSON.parse((calls[0][1] as RequestInit).body as string);
    const chunk3 = JSON.parse((calls[2][1] as RequestInit).body as string);
    expect(chunk1.events.length).toBe(50);
    expect(chunk3.events.length).toBe(20);
  });
});
