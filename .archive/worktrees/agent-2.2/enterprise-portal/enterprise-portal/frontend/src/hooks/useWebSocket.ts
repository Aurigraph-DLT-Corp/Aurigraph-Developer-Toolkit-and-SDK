/**
 * useWebSocket Hook
 *
 * Custom React hook for managing WebSocket connections
 * Handles subscription lifecycle and component cleanup
 *
 * Usage:
 * const { data, isConnected, error } = useWebSocket('metrics', {
 *   onMessage: (event) => console.log(event.data),
 *   autoConnect: true
 * });
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { websocketService, WebSocketChannel, WebSocketEvent } from '../services/websocketService';

export interface UseWebSocketOptions {
  onMessage?: (event: WebSocketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export interface UseWebSocketResult {
  data: any;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (data: any) => boolean;
}

export const useWebSocket = (
  channel: WebSocketChannel,
  options: UseWebSocketOptions = {}
): UseWebSocketResult => {
  const { onMessage, onConnect, onDisconnect, onError, autoConnect = true } = options;

  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: WebSocketEvent) => {
      // Update data
      setData(event.data);

      // Call user's onMessage callback
      if (onMessage) {
        onMessage(event);
      }
    },
    [onMessage]
  );

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Connect to channel
      await websocketService.connect(channel);

      // Subscribe to messages
      unsubscribeRef.current = websocketService.subscribe(channel, (event) => {
        if (event.type === 'connected') {
          setIsConnected(true);
          setIsConnecting(false);
          onConnect?.();
        } else if (event.type === 'disconnected') {
          setIsConnected(false);
          onDisconnect?.();
        } else {
          handleMessage(event);
        }
      });

      setIsConnected(true);
      setIsConnecting(false);
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to connect to WebSocket');
      setError(error);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [channel, handleMessage, onConnect, onDisconnect, onError]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    websocketService.disconnect(channel);
    setIsConnected(false);
    setData(null);
  }, [channel]);

  // Send a message
  const send = useCallback(
    (msgData: any) => {
      return websocketService.send(channel, msgData);
    },
    [channel]
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [channel, autoConnect, connect, disconnect]);

  return {
    data,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    send,
  };
};

export default useWebSocket;
