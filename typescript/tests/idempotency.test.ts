import { describe, it, expect } from 'vitest';
import { generateKey, generateKeySync, canonicalize } from '../src/idempotency.js';

describe('idempotency', () => {
  it('T1: same payload (regardless of key order) produces the same key', async () => {
    const a = { method: 'POST', path: '/dmrv/events', body: { deviceId: 'd1', quantity: 5 } };
    const b = { body: { quantity: 5, deviceId: 'd1' }, path: '/dmrv/events', method: 'POST' };
    const ka = await generateKey(a);
    const kb = await generateKey(b);
    expect(ka).toBe(kb);
    expect(ka.length).toBeGreaterThan(16);

    // Sync variant must also be deterministic and identical for reordered keys.
    expect(generateKeySync(a)).toBe(generateKeySync(b));

    // Canonical form sorts keys
    expect(canonicalize(a)).toBe(canonicalize(b));
  });

  it('T2: different payloads produce different keys', async () => {
    const a = await generateKey({ path: '/a', body: { v: 1 } });
    const b = await generateKey({ path: '/a', body: { v: 2 } });
    const c = await generateKey({ path: '/b', body: { v: 1 } });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);

    expect(generateKeySync({ v: 1 })).not.toBe(generateKeySync({ v: 2 }));
  });
});
