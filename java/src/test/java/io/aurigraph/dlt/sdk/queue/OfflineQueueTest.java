package io.aurigraph.dlt.sdk.queue;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

class OfflineQueueTest {

    @Test
    void t1_enqueueWhileOfflineThenFlushWhenOnline() {
        OfflineQueue q = new OfflineQueue();
        q.enqueue("POST", "/dmrv/events", "{\"deviceId\":\"d1\"}", null);
        q.enqueue("POST", "/dmrv/events", "{\"deviceId\":\"d2\"}", null);
        assertEquals(2, q.size());

        List<OfflineQueue.Operation> seen = new ArrayList<>();
        q.setFlushHandler(seen::add);
        int flushed = q.flush();

        assertEquals(2, flushed);
        assertEquals(0, q.size());
        assertEquals("/dmrv/events", seen.get(0).path);
        assertEquals("/dmrv/events", seen.get(1).path);
    }

    @Test
    void t2_maxSizeEnforcementDropsOldestAndEmitsDrop() {
        OfflineQueue q = new OfflineQueue(3);
        AtomicInteger drops = new AtomicInteger(0);
        q.onEvent(OfflineQueue.EventKind.DROP, op -> drops.incrementAndGet());

        for (int i = 0; i < 5; i++) {
            q.enqueue("POST", "/x/" + i, null, null);
        }
        assertEquals(3, q.size());
        assertEquals(2, drops.get());

        // Oldest 2 dropped → remaining are /x/2, /x/3, /x/4
        List<OfflineQueue.Operation> snap = q.snapshot();
        assertEquals("/x/2", snap.get(0).path);
        assertEquals("/x/3", snap.get(1).path);
        assertEquals("/x/4", snap.get(2).path);
    }

    @Test
    void t3_idempotencyKeyDedupsOnEnqueue() {
        OfflineQueue q = new OfflineQueue();
        q.enqueue("POST", "/a", "{\"v\":1}", "abc");
        q.enqueue("POST", "/a", "{\"v\":2}", "abc"); // replaces the previous 'abc'
        q.enqueue("POST", "/b", "{\"v\":3}", "def");
        assertEquals(2, q.size());

        List<OfflineQueue.Operation> handled = new ArrayList<>();
        q.setFlushHandler(handled::add);
        q.flush();
        assertEquals(2, handled.size());

        OfflineQueue.Operation abcOp = handled.stream()
                .filter(o -> "abc".equals(o.idempotencyKey))
                .findFirst()
                .orElseThrow();
        assertEquals("{\"v\":2}", abcOp.body);
    }
}
