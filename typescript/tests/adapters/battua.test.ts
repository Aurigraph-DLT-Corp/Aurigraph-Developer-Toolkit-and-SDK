import { describe, it, expect, vi } from 'vitest';
import { BattuaAdapter } from '../../src/adapters/battua/adapter.js';
import type { BattuaTransferEvent } from '../../src/adapters/battua/types.js';
import { ValidationError } from '../../src/errors.js';
import type { AurigraphClient } from '../../src/client.js';

function makeMockClient() {
  const recordEvent = vi.fn().mockResolvedValue({
    eventId: 'evt-1',
    status: 'ACCEPTED',
    txHash: '0xabc',
  });
  const nodes = vi.fn().mockResolvedValue([]);
  const registerNodeHeartbeat = vi
    .fn()
    .mockResolvedValue({ nodeId: 'battua-node-1', status: 'OK' });

  const client = {
    dmrv: { recordEvent },
    registries: {
      battua: { nodes, registerNodeHeartbeat },
    },
  } as unknown as AurigraphClient;

  return { client, recordEvent, nodes, registerNodeHeartbeat };
}

describe('BattuaAdapter', () => {
  it('T1: recordTransferEvent maps to DMRV with ISO_14064 framework', async () => {
    const { client, recordEvent } = makeMockClient();
    const adapter = new BattuaAdapter(client);
    const event: BattuaTransferEvent = {
      txHash: '0xdeadbeef',
      fromWallet: 'aur1alice123',
      toWallet: 'aur1bob456789',
      amount: '1000.50',
      symbol: 'USDT',
      memo: 'invoice-42',
    };
    const receipt = await adapter.recordTransferEvent(event);
    expect(receipt.status).toBe('ACCEPTED');
    expect(recordEvent).toHaveBeenCalledTimes(1);
    const dmrvArg = recordEvent.mock.calls[0][0];
    expect(dmrvArg.deviceId).toBe('0xdeadbeef');
    expect(dmrvArg.eventType).toBe('StablecoinTransfer');
    expect(dmrvArg.quantity).toBeCloseTo(1000.5);
    expect(dmrvArg.unit).toBe('USDT');
    expect(dmrvArg.metadata.framework).toBe('ISO_14064');
    expect(dmrvArg.metadata.fromWallet).toBe('aur1alice123');
  });

  it('T2: invalid wallet address (no aur1 prefix) throws', async () => {
    const { client } = makeMockClient();
    const adapter = new BattuaAdapter(client);
    const badEvent: BattuaTransferEvent = {
      txHash: '0xdeadbeef',
      fromWallet: '0xnotbattua',
      toWallet: 'aur1bob456789',
      amount: '100',
      symbol: 'USDT',
    };
    await expect(adapter.recordTransferEvent(badEvent)).rejects.toThrow(ValidationError);
  });

  it('T3: invalid symbol throws', async () => {
    const { client } = makeMockClient();
    const adapter = new BattuaAdapter(client);
    const badEvent = {
      txHash: '0xdeadbeef',
      fromWallet: 'aur1alice123',
      toWallet: 'aur1bob456789',
      amount: '100',
      symbol: 'XYZ',
    } as unknown as BattuaTransferEvent;
    await expect(adapter.recordTransferEvent(badEvent)).rejects.toThrow(ValidationError);
  });

  it('T4: registerNodeHeartbeat calls upsert endpoint', async () => {
    const { client, registerNodeHeartbeat } = makeMockClient();
    const adapter = new BattuaAdapter(client);
    await adapter.registerNodeHeartbeat('battua-node-1');
    expect(registerNodeHeartbeat).toHaveBeenCalledTimes(1);
    const arg = registerNodeHeartbeat.mock.calls[0][0];
    expect(arg.nodeId).toBe('battua-node-1');
    expect(typeof arg.lastHeartbeat).toBe('string');
  });
});
