import { describe, it, expect, vi } from 'vitest';
import { OfflineQueue } from '../src/queue.js';
import type { QueuedOperation } from '../src/types.js';

describe('OfflineQueue', () => {
  it('T1: enqueue while offline, flush when online', async () => {
    const q = new OfflineQueue({ flushIntervalMs: 0 });
    q.enqueue({ method: 'POST', path: '/dmrv/events', body: { deviceId: 'd1' } });
    q.enqueue({ method: 'POST', path: '/dmrv/events', body: { deviceId: 'd2' } });
    expect(q.size()).toBe(2);

    const seen: QueuedOperation[] = [];
    q.setFlushHandler(async (op) => {
      seen.push(op);
    });
    const result = await q.flush();
    expect(result.flushed).toBe(2);
    expect(result.remaining).toBe(0);
    expect(seen.map((o) => (o.body as { deviceId: string }).deviceId)).toEqual(['d1', 'd2']);
    expect(q.size()).toBe(0);
    q.dispose();
  });

  it('T2: max size enforcement drops oldest and emits drop event', async () => {
    const q = new OfflineQueue({ maxSize: 3, flushIntervalMs: 0 });
    const dropped: QueuedOperation[] = [];
    q.onEvent('drop', (op) => dropped.push(op as QueuedOperation));

    for (let i = 0; i < 5; i++) {
      q.enqueue({ method: 'POST', path: `/x/${i}`, body: { i } });
    }
    expect(q.size()).toBe(3);
    // Oldest 2 were dropped
    expect(dropped.length).toBe(2);
    const paths = q.snapshot().map((o) => o.path);
    expect(paths).toEqual(['/x/2', '/x/3', '/x/4']);
    q.dispose();
  });

  it('T3: idempotency key dedups on enqueue (no duplicate flush)', async () => {
    const q = new OfflineQueue({ flushIntervalMs: 0 });
    q.enqueue({ method: 'POST', path: '/a', body: { v: 1 }, idempotencyKey: 'abc' });
    q.enqueue({ method: 'POST', path: '/a', body: { v: 2 }, idempotencyKey: 'abc' });
    q.enqueue({ method: 'POST', path: '/b', body: { v: 3 }, idempotencyKey: 'def' });
    expect(q.size()).toBe(2); // dedup: abc replaced, def added

    const handled: QueuedOperation[] = [];
    q.setFlushHandler(async (op) => {
      handled.push(op);
    });
    await q.flush();
    expect(handled.length).toBe(2);
    // The 'abc' entry should be the second (replaced) version: v=2
    const abc = handled.find((o) => o.idempotencyKey === 'abc');
    expect((abc?.body as { v: number }).v).toBe(2);
    q.dispose();
  });
});
