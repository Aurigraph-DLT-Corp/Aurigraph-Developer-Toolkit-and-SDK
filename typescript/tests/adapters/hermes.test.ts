import { describe, it, expect, vi } from 'vitest';
import { HermesAdapter } from '../../src/adapters/hermes/adapter.js';
import type {
  HermesBatchEvent,
  HermesTradeEvent,
} from '../../src/adapters/hermes/types.js';
import { ValidationError } from '../../src/errors.js';
import type { AurigraphClient } from '../../src/client.js';

const TRADER = '0x1234567890abcdef1234567890abcdef12345678';

function makeTrade(i: number): HermesTradeEvent {
  return {
    tradeId: `trade-${i}`,
    symbol: 'BTC/USD',
    side: i % 2 === 0 ? 'BUY' : 'SELL',
    quantity: '0.5',
    price: '65000.00',
    traderAddress: TRADER,
    timestamp: `2026-04-06T00:${String(i % 60).padStart(2, '0')}:00Z`,
  };
}

function makeMockClient() {
  const recordEvent = vi.fn().mockResolvedValue({
    eventId: 'evt-1',
    status: 'ACCEPTED',
    txHash: '0xbeef',
  });
  const batchRecord = vi.fn().mockImplementation(async (events: unknown[]) => ({
    accepted: events.length,
    rejected: 0,
    receipts: events.map((_, i) => ({
      eventId: `batch-evt-${i}`,
      status: 'ACCEPTED',
      txHash: '0xbatch',
    })),
    errors: [],
  }));
  const getAuditTrail = vi.fn().mockResolvedValue([
    {
      eventId: 'evt-1',
      deviceId: 'trade-1',
      eventType: 'Trade',
      quantity: 0.5,
      timestamp: '2026-04-06T00:00:00Z',
      metadata: {
        framework: 'GHG_PROTOCOL',
        domain: 'hermes',
        symbol: 'BTC/USD',
        side: 'BUY',
        quantity: '0.5',
        price: '65000.00',
        traderAddress: TRADER,
        tradeHash: '0xmatch',
      },
    },
    {
      eventId: 'evt-2',
      deviceId: 'trade-other',
      eventType: 'Trade',
      quantity: 1,
      timestamp: '2026-04-06T01:00:00Z',
      metadata: {
        framework: 'GHG_PROTOCOL',
        domain: 'hermes',
        symbol: 'ETH/USD',
        side: 'SELL',
        quantity: '1',
        price: '3500',
        traderAddress: '0xffffffffffffffffffffffffffffffffffffffff',
      },
    },
  ]);
  const triggerMint = vi.fn();

  const client = {
    dmrv: { recordEvent, batchRecord, getAuditTrail, triggerMint },
  } as unknown as AurigraphClient;

  return { client, recordEvent, batchRecord, getAuditTrail };
}

describe('HermesAdapter', () => {
  it('T1: recordTrade maps to DMRV with GHG_PROTOCOL framework', async () => {
    const { client, recordEvent } = makeMockClient();
    const adapter = new HermesAdapter(client);
    const receipt = await adapter.recordTrade(makeTrade(1));
    expect(receipt.status).toBe('ACCEPTED');
    const dmrvArg = recordEvent.mock.calls[0][0];
    expect(dmrvArg.deviceId).toBe('trade-1');
    expect(dmrvArg.eventType).toBe('Trade');
    expect(dmrvArg.metadata.framework).toBe('GHG_PROTOCOL');
    expect(dmrvArg.metadata.domain).toBe('hermes');
    expect(dmrvArg.metadata.traderAddress).toBe(TRADER);
  });

  it('T2: invalid trader address throws', async () => {
    const { client } = makeMockClient();
    const adapter = new HermesAdapter(client);
    const bad: HermesTradeEvent = { ...makeTrade(1), traderAddress: '0xnotvalid' };
    await expect(adapter.recordTrade(bad)).rejects.toThrow(ValidationError);
  });

  it('T3: recordBatch with 100 trades splits into 2x 50-trade chunks', async () => {
    const { client, batchRecord } = makeMockClient();
    const adapter = new HermesAdapter(client);
    const trades = Array.from({ length: 100 }, (_, i) => makeTrade(i));
    const batch: HermesBatchEvent = {
      batchId: 'batch-1',
      trades,
      totalVolume: '50.0',
    };
    const receipt = await adapter.recordBatch(batch);
    expect(batchRecord).toHaveBeenCalledTimes(2);
    expect(batchRecord.mock.calls[0][0]).toHaveLength(50);
    expect(batchRecord.mock.calls[1][0]).toHaveLength(50);
    expect(receipt.eventId).toBe('batch-1');
    expect(receipt.status).toBe('ACCEPTED');
  });

  it('T4: verifyTrade returns true on hash match', async () => {
    const { client } = makeMockClient();
    const adapter = new HermesAdapter(client);
    const ok = await adapter.verifyTrade('trade-1', '0xmatch');
    expect(ok).toBe(true);
    const notOk = await adapter.verifyTrade('trade-1', '0xnope');
    expect(notOk).toBe(false);
  });

  it('T5: getTradeAuditTrail returns array filtered by trader', async () => {
    const { client } = makeMockClient();
    const adapter = new HermesAdapter(client);
    const trail = await adapter.getTradeAuditTrail(TRADER);
    expect(Array.isArray(trail)).toBe(true);
    expect(trail.length).toBe(1);
    expect(trail[0].traderAddress).toBe(TRADER);
    expect(trail[0].tradeId).toBe('trade-1');
  });
});
