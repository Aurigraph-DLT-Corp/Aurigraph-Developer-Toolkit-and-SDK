package io.aurigraph.dlt.sdk.queue;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

/**
 * In-memory FIFO queue of pending mutating SDK operations that will be
 * replayed when network connectivity is restored.
 *
 * <p>Thread-safe: backed by a {@link LinkedBlockingDeque}. Max size
 * is enforced; overflow drops the oldest entry and emits a 'drop' event.
 * Idempotency-key based dedup is applied at enqueue time.
 */
public class OfflineQueue {

    /** Event kinds emitted via {@link #onEvent(EventKind, Consumer)}. */
    public enum EventKind { ENQUEUE, FLUSH, ERROR, DROP }

    /** A single pending operation. */
    public static class Operation {
        public final String id;
        public final String method;
        public final String path;
        public final Object body;
        public final String idempotencyKey;
        public final long enqueuedAt;
        public int attempts;

        public Operation(String method, String path, Object body, String idempotencyKey) {
            this.id = UUID.randomUUID().toString();
            this.method = method;
            this.path = path;
            this.body = body;
            this.idempotencyKey = idempotencyKey;
            this.enqueuedAt = System.currentTimeMillis();
            this.attempts = 0;
        }
    }

    /** Flush callback — must throw on failure; success pops the operation. */
    @FunctionalInterface
    public interface FlushHandler {
        void accept(Operation op) throws Exception;
    }

    private final LinkedBlockingDeque<Operation> deque = new LinkedBlockingDeque<>();
    private final int maxSize;
    private final Map<EventKind, List<Consumer<Object>>> listeners = new ConcurrentHashMap<>();
    private final AtomicBoolean flushing = new AtomicBoolean(false);
    private volatile FlushHandler flushHandler;

    public OfflineQueue() {
        this(1000);
    }

    public OfflineQueue(int maxSize) {
        if (maxSize <= 0) throw new IllegalArgumentException("maxSize must be > 0");
        this.maxSize = maxSize;
    }

    public void setFlushHandler(FlushHandler handler) {
        this.flushHandler = handler;
    }

    /**
     * Enqueue a new operation. If an op with the same idempotencyKey already
     * exists, it is replaced in place (dedup). If the queue is full, the
     * oldest entry is dropped and a 'drop' event is emitted.
     */
    public synchronized Operation enqueue(String method, String path, Object body, String idempotencyKey) {
        Operation op = new Operation(method, path, body, idempotencyKey);
        if (idempotencyKey != null) {
            Iterator<Operation> it = deque.iterator();
            int idx = 0;
            int replace = -1;
            while (it.hasNext()) {
                Operation existing = it.next();
                if (idempotencyKey.equals(existing.idempotencyKey)) {
                    replace = idx;
                    break;
                }
                idx++;
            }
            if (replace >= 0) {
                // LinkedBlockingDeque lacks set-by-index; rebuild around the replace.
                List<Operation> snapshot = new ArrayList<>(deque);
                snapshot.set(replace, op);
                deque.clear();
                deque.addAll(snapshot);
                emit(EventKind.ENQUEUE, op);
                return op;
            }
        }
        while (deque.size() >= maxSize) {
            Operation dropped = deque.pollFirst();
            if (dropped != null) emit(EventKind.DROP, dropped);
        }
        deque.offerLast(op);
        emit(EventKind.ENQUEUE, op);
        return op;
    }

    /** Current queue depth. */
    public int size() {
        return deque.size();
    }

    /** Immutable snapshot of the queue. */
    public List<Operation> snapshot() {
        return new ArrayList<>(deque);
    }

    /** Clear all queued operations. */
    public synchronized void clear() {
        deque.clear();
    }

    /**
     * Flush all queued operations via the registered handler. Stops on the
     * first handler error. Re-entrant safe — concurrent flush() calls return
     * immediately with zero work done.
     *
     * @return number of successfully flushed operations.
     */
    public int flush() {
        FlushHandler h = this.flushHandler;
        if (h == null) return 0;
        if (!flushing.compareAndSet(false, true)) return 0;
        int flushed = 0;
        try {
            while (true) {
                Operation head = deque.peekFirst();
                if (head == null) break;
                head.attempts += 1;
                try {
                    h.accept(head);
                    deque.pollFirst();
                    flushed += 1;
                    emit(EventKind.FLUSH, head);
                } catch (Exception e) {
                    emit(EventKind.ERROR, head);
                    break;
                }
            }
            return flushed;
        } finally {
            flushing.set(false);
        }
    }

    /** Subscribe to queue events. */
    public void onEvent(EventKind kind, Consumer<Object> listener) {
        listeners.computeIfAbsent(kind, k -> new ArrayList<>()).add(listener);
    }

    private void emit(EventKind kind, Object payload) {
        List<Consumer<Object>> ls = listeners.get(kind);
        if (ls == null) return;
        for (Consumer<Object> l : ls) {
            try {
                l.accept(payload);
            } catch (Exception ignored) {
                // listener errors must not break the queue
            }
        }
    }
}
