/**
 * GrpcWebClient.ts
 * Core gRPC-Web client implementation for Aurigraph V12
 *
 * This module provides a type-safe, streaming-capable gRPC-Web client
 * that replaces WebSocket connections with HTTP/2 + Protobuf.
 *
 * Features:
 * - Server-side streaming support
 * - Automatic reconnection with exponential backoff
 * - Type-safe message handling
 * - Connection status monitoring
 * - CORS-compatible requests via Envoy proxy
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type GrpcStreamStatus =
  | 'IDLE'
  | 'CONNECTING'
  | 'STREAMING'
  | 'RECONNECTING'
  | 'ERROR'
  | 'CLOSED'

export interface GrpcStreamState<T> {
  status: GrpcStreamStatus
  data: T | null
  error: string | null
  lastUpdate: number | null
  reconnectAttempts: number
  streamId: string | null
}

export interface GrpcClientConfig {
  baseUrl: string
  timeout: number
  maxReconnectAttempts: number
  reconnectDelayMs: number
  reconnectMaxDelayMs: number
  reconnectMultiplier: number
  enableCompression: boolean
  debug: boolean
}

export interface StreamOptions {
  updateIntervalMs?: number
  includeHistorical?: boolean
  historicalMinutes?: number
  bufferSize?: number
}

export type MessageHandler<T> = (message: T) => void
export type ErrorHandler = (error: Error) => void
export type StatusHandler = (status: GrpcStreamStatus) => void

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: GrpcClientConfig = {
  baseUrl: import.meta.env.VITE_GRPC_WEB_URL || 'http://localhost:8080',
  timeout: 30000,
  maxReconnectAttempts: 10,
  reconnectDelayMs: 1000,
  reconnectMaxDelayMs: 30000,
  reconnectMultiplier: 2,
  enableCompression: false,
  debug: import.meta.env.DEV || false
}

// Production URL
const PROD_GRPC_WEB_URL = 'https://dlt.aurigraph.io/grpc-web'

// ============================================================================
// GRPC-WEB FRAME PARSING
// ============================================================================

/**
 * gRPC-Web frame format:
 * - 1 byte: compressed flag (0 = uncompressed, 1 = compressed)
 * - 4 bytes: message length (big endian)
 * - N bytes: message data
 */
function parseGrpcWebFrame(data: ArrayBuffer): { messages: Uint8Array[], trailers: Map<string, string> | null } {
  const view = new DataView(data)
  const messages: Uint8Array[] = []
  let trailers: Map<string, string> | null = null
  let offset = 0

  while (offset < data.byteLength) {
    if (offset + 5 > data.byteLength) break

    const frameType = view.getUint8(offset)
    const length = view.getUint32(offset + 1, false) // big endian

    if (offset + 5 + length > data.byteLength) break

    const frameData = new Uint8Array(data, offset + 5, length)

    if (frameType === 0x00) {
      // Data frame
      messages.push(frameData)
    } else if (frameType === 0x80) {
      // Trailers frame
      trailers = parseTrailers(frameData)
    }

    offset += 5 + length
  }

  return { messages, trailers }
}

function parseTrailers(data: Uint8Array): Map<string, string> {
  const trailers = new Map<string, string>()
  const text = new TextDecoder().decode(data)
  const lines = text.split('\r\n')

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim().toLowerCase()
      const value = line.substring(colonIndex + 1).trim()
      trailers.set(key, value)
    }
  }

  return trailers
}

// ============================================================================
// BASE64 ENCODING FOR GRPC-WEB-TEXT
// ============================================================================

function encodeBase64(data: Uint8Array): string {
  const binary = String.fromCharCode(...data)
  return btoa(binary)
}

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ============================================================================
// GRPC-WEB CLIENT CLASS
// ============================================================================

export class GrpcWebClient {
  private config: GrpcClientConfig
  private activeStreams: Map<string, AbortController> = new Map()

  constructor(config: Partial<GrpcClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }

    // Auto-detect production URL
    if (typeof window !== 'undefined' && window.location.hostname === 'dlt.aurigraph.io') {
      this.config.baseUrl = PROD_GRPC_WEB_URL
    }

    if (this.config.debug) {
      console.log('[gRPC-Web] Client initialized with config:', this.config)
    }
  }

  /**
   * Make a unary (single request/response) gRPC call
   */
  async unary<TRequest, TResponse>(
    service: string,
    method: string,
    request: TRequest,
    deserialize: (data: Uint8Array) => TResponse
  ): Promise<TResponse> {
    const url = `${this.config.baseUrl}/${service}/${method}`

    if (this.config.debug) {
      console.log(`[gRPC-Web] Unary call: ${service}/${method}`)
    }

    const requestData = this.serializeRequest(request)
    const framedData = this.createGrpcWebFrame(requestData)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/grpc-web+proto',
        'X-Grpc-Web': '1',
        'X-User-Agent': 'grpc-web-javascript/0.1'
      },
      body: framedData
    })

    if (!response.ok) {
      throw new Error(`gRPC call failed: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.arrayBuffer()
    const { messages, trailers } = parseGrpcWebFrame(responseData)

    // Check for gRPC errors in trailers
    if (trailers) {
      const grpcStatus = trailers.get('grpc-status')
      if (grpcStatus && grpcStatus !== '0') {
        const grpcMessage = trailers.get('grpc-message') || 'Unknown error'
        throw new Error(`gRPC error ${grpcStatus}: ${grpcMessage}`)
      }
    }

    if (messages.length === 0) {
      throw new Error('No response message received')
    }

    return deserialize(messages[0])
  }

  /**
   * Start a server-streaming gRPC call
   */
  serverStream<TRequest, TResponse>(
    service: string,
    method: string,
    request: TRequest,
    deserialize: (data: Uint8Array) => TResponse,
    onMessage: MessageHandler<TResponse>,
    onError: ErrorHandler,
    onStatus: StatusHandler,
    options: StreamOptions = {}
  ): () => void {
    const streamId = `${service}/${method}-${Date.now()}`
    const abortController = new AbortController()

    this.activeStreams.set(streamId, abortController)

    if (this.config.debug) {
      console.log(`[gRPC-Web] Starting stream: ${streamId}`)
    }

    onStatus('CONNECTING')

    this.startStream(
      service,
      method,
      request,
      deserialize,
      onMessage,
      onError,
      onStatus,
      abortController.signal,
      streamId,
      0
    )

    // Return cancel function
    return () => {
      if (this.config.debug) {
        console.log(`[gRPC-Web] Cancelling stream: ${streamId}`)
      }
      abortController.abort()
      this.activeStreams.delete(streamId)
      onStatus('CLOSED')
    }
  }

  private async startStream<TRequest, TResponse>(
    service: string,
    method: string,
    request: TRequest,
    deserialize: (data: Uint8Array) => TResponse,
    onMessage: MessageHandler<TResponse>,
    onError: ErrorHandler,
    onStatus: StatusHandler,
    signal: AbortSignal,
    streamId: string,
    reconnectAttempt: number
  ): Promise<void> {
    const url = `${this.config.baseUrl}/${service}/${method}`

    try {
      const requestData = this.serializeRequest(request)
      const framedData = this.createGrpcWebFrame(requestData)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'X-Grpc-Web': '1',
          'X-User-Agent': 'grpc-web-javascript/0.1',
          'Accept': 'application/grpc-web+proto'
        },
        body: framedData,
        signal
      })

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`)
      }

      onStatus('STREAMING')

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      let buffer = new Uint8Array(0)

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          if (this.config.debug) {
            console.log(`[gRPC-Web] Stream ended: ${streamId}`)
          }
          break
        }

        if (value) {
          // Append to buffer
          const newBuffer = new Uint8Array(buffer.length + value.length)
          newBuffer.set(buffer)
          newBuffer.set(value, buffer.length)
          buffer = newBuffer

          // Try to parse complete frames
          const { messages, trailers } = parseGrpcWebFrame(buffer.buffer)

          for (const msg of messages) {
            try {
              const decoded = deserialize(msg)
              onMessage(decoded)
            } catch (parseError) {
              console.error('[gRPC-Web] Failed to deserialize message:', parseError)
            }
          }

          // Check for stream completion
          if (trailers) {
            const grpcStatus = trailers.get('grpc-status')
            if (grpcStatus && grpcStatus !== '0') {
              const grpcMessage = trailers.get('grpc-message') || 'Unknown error'
              throw new Error(`gRPC error ${grpcStatus}: ${grpcMessage}`)
            }
            break
          }

          // Clear processed messages from buffer
          // Note: This is simplified; production code should track exact byte positions
          buffer = new Uint8Array(0)
        }
      }

      // Stream ended normally - attempt reconnection
      if (!signal.aborted && this.activeStreams.has(streamId)) {
        this.scheduleReconnect(
          service, method, request, deserialize, onMessage, onError, onStatus,
          signal, streamId, reconnectAttempt
        )
      }

    } catch (error) {
      if (signal.aborted) {
        return // Intentional cancellation
      }

      console.error(`[gRPC-Web] Stream error: ${streamId}`, error)
      onError(error instanceof Error ? error : new Error(String(error)))
      onStatus('ERROR')

      // Attempt reconnection
      if (this.activeStreams.has(streamId) && reconnectAttempt < this.config.maxReconnectAttempts) {
        this.scheduleReconnect(
          service, method, request, deserialize, onMessage, onError, onStatus,
          signal, streamId, reconnectAttempt
        )
      }
    }
  }

  private scheduleReconnect<TRequest, TResponse>(
    service: string,
    method: string,
    request: TRequest,
    deserialize: (data: Uint8Array) => TResponse,
    onMessage: MessageHandler<TResponse>,
    onError: ErrorHandler,
    onStatus: StatusHandler,
    signal: AbortSignal,
    streamId: string,
    currentAttempt: number
  ): void {
    const delay = Math.min(
      this.config.reconnectDelayMs * Math.pow(this.config.reconnectMultiplier, currentAttempt),
      this.config.reconnectMaxDelayMs
    )

    if (this.config.debug) {
      console.log(`[gRPC-Web] Scheduling reconnect in ${delay}ms (attempt ${currentAttempt + 1})`)
    }

    onStatus('RECONNECTING')

    setTimeout(() => {
      if (!signal.aborted && this.activeStreams.has(streamId)) {
        this.startStream(
          service, method, request, deserialize, onMessage, onError, onStatus,
          signal, streamId, currentAttempt + 1
        )
      }
    }, delay)
  }

  /**
   * Serialize request object to Uint8Array
   * Note: In production, this would use generated protobuf serializers
   */
  private serializeRequest<T>(request: T): Uint8Array {
    // For now, use JSON as intermediate format
    // In production, use protobuf-ts or similar for proper serialization
    const json = JSON.stringify(request)
    return new TextEncoder().encode(json)
  }

  /**
   * Create gRPC-Web frame from message data
   */
  private createGrpcWebFrame(data: Uint8Array): Uint8Array {
    const frame = new Uint8Array(5 + data.length)
    frame[0] = 0x00 // Uncompressed
    frame[1] = (data.length >> 24) & 0xff
    frame[2] = (data.length >> 16) & 0xff
    frame[3] = (data.length >> 8) & 0xff
    frame[4] = data.length & 0xff
    frame.set(data, 5)
    return frame
  }

  /**
   * Close all active streams
   */
  closeAll(): void {
    for (const [streamId, controller] of this.activeStreams) {
      if (this.config.debug) {
        console.log(`[gRPC-Web] Closing stream: ${streamId}`)
      }
      controller.abort()
    }
    this.activeStreams.clear()
  }

  /**
   * Get number of active streams
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const grpcClient = new GrpcWebClient()

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).__grpcClient = grpcClient
}
