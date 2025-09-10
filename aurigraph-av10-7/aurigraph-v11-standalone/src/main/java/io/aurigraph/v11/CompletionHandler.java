package io.aurigraph.v11;

import java.util.function.Consumer;

/**
 * Completion handler for asynchronous operations
 */
public class CompletionHandler<T> {
    
    private final Consumer<T> onSuccess;
    private final Consumer<Exception> onFailure;
    
    public CompletionHandler(Consumer<T> onSuccess, Consumer<Exception> onFailure) {
        this.onSuccess = onSuccess;
        this.onFailure = onFailure;
    }
    
    public void onSuccess(T result) {
        if (onSuccess != null) {
            onSuccess.accept(result);
        }
    }
    
    public void onFailure(Exception exception) {
        if (onFailure != null) {
            onFailure.accept(exception);
        }
    }
}