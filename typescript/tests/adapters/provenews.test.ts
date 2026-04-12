import { describe, it, expect, vi } from 'vitest';
import { ProvenewsAdapter } from '../../src/adapters/provenews/adapter.js';
import type { ProvenewsAssetEvent } from '../../src/adapters/provenews/types.js';
import { ValidationError } from '../../src/errors.js';
import type { AurigraphClient } from '../../src/client.js';

const VALID_HASH = 'a'.repeat(64);
const VALID_CONTRACT_UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeMockClient() {
  const recordEvent = vi.fn().mockResolvedValue({
    eventId: 'evt-1',
    status: 'ACCEPTED',
    txHash: '0xabc',
  });
  const batchRecord = vi.fn();
  const getAuditTrail = vi.fn().mockResolvedValue([
    {
      eventId: 'evt-1',
      deviceId: 'asset-1',
      eventType: 'ContentRegistered',
      quantity: 1,
      timestamp: '2026-04-06T00:00:00Z',
      metadata: {
        framework: 'C2PA',
        domain: 'provenews',
        contentHash: VALID_HASH,
        ownerId: 'owner-1',
      },
    },
  ]);
  const triggerMint = vi.fn().mockResolvedValue({
    contractId: VALID_CONTRACT_UUID,
    eventType: 'AttributionMint',
    quantity: 1,
    tokenId: 'tok-1',
    status: 'MINTED',
  });

  const client = {
    dmrv: { recordEvent, batchRecord, getAuditTrail, triggerMint },
  } as unknown as AurigraphClient;

  return { client, recordEvent, batchRecord, getAuditTrail, triggerMint };
}

describe('ProvenewsAdapter', () => {
  it('T1: recordAssetEvent maps to DMRV with C2PA framework', async () => {
    const { client, recordEvent } = makeMockClient();
    const adapter = new ProvenewsAdapter(client);
    const event: ProvenewsAssetEvent = {
      assetId: 'asset-1',
      eventType: 'ContentRegistered',
      contentHash: VALID_HASH,
      ownerId: 'owner-1',
      timestamp: '2026-04-06T00:00:00Z',
    };
    const receipt = await adapter.recordAssetEvent(event);
    expect(receipt.status).toBe('ACCEPTED');
    expect(recordEvent).toHaveBeenCalledTimes(1);
    const dmrvArg = recordEvent.mock.calls[0][0];
    expect(dmrvArg.deviceId).toBe('asset-1');
    expect(dmrvArg.eventType).toBe('ContentRegistered');
    expect(dmrvArg.metadata.framework).toBe('C2PA');
    expect(dmrvArg.metadata.domain).toBe('provenews');
    expect(dmrvArg.metadata.contentHash).toBe(VALID_HASH);
  });

  it('T2: invalid content hash throws ValidationError', async () => {
    const { client } = makeMockClient();
    const adapter = new ProvenewsAdapter(client);
    const badEvent: ProvenewsAssetEvent = {
      assetId: 'asset-1',
      eventType: 'ContentRegistered',
      contentHash: 'not-a-sha256',
      ownerId: 'owner-1',
      timestamp: '2026-04-06T00:00:00Z',
    };
    await expect(adapter.recordAssetEvent(badEvent)).rejects.toThrow(ValidationError);
  });

  it('T3: getAssetTrail returns an array', async () => {
    const { client, getAuditTrail } = makeMockClient();
    const adapter = new ProvenewsAdapter(client);
    const trail = await adapter.getAssetTrail('asset-1');
    expect(Array.isArray(trail)).toBe(true);
    expect(trail.length).toBe(1);
    expect(trail[0].assetId).toBe('asset-1');
    expect(trail[0].contentHash).toBe(VALID_HASH);
    expect(getAuditTrail).toHaveBeenCalledWith({ deviceId: 'asset-1' });
  });

  it('T4: mintAttributionToken calls dmrv.triggerMint', async () => {
    const { client, triggerMint } = makeMockClient();
    const adapter = new ProvenewsAdapter(client);
    const receipt = await adapter.mintAttributionToken(VALID_CONTRACT_UUID);
    expect(triggerMint).toHaveBeenCalledWith(VALID_CONTRACT_UUID, 'AttributionMint', 1);
    expect(receipt.tokenId).toBe('tok-1');
  });
});
