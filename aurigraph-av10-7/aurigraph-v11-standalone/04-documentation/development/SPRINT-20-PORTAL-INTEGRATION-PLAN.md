# Sprint 20: Portal Frontend Integration Plan

## Executive Summary

**Sprint Duration:** 3 weeks (21 days)
**Total Effort:** 30-38 hours
**Team Size:** 2-3 developers
**Risk Level:** Medium

This plan provides a comprehensive, actionable roadmap for integrating the Aurigraph Enterprise Portal (React/TypeScript) with the v11.4.4 backend REST APIs and WebSocket services.

---

## Backend Context

### Available Backend Endpoints (v11.4.4)

#### Authentication Endpoints
- **POST** `/api/v11/login/authenticate` - User authentication with session management
- **GET** `/api/v11/login/verify` - Session verification
- **POST** `/api/v11/login/logout` - Session invalidation

#### REST API Endpoints
- **GET** `/api/v11/demos` - List all demos
- **POST** `/api/v11/demos` - Create new demo (requires auth)
- **GET** `/api/v11/demos/{id}` - Get demo details
- **POST** `/api/v11/demos/{id}/start` - Start demo
- **POST** `/api/v11/demos/{id}/stop` - Stop demo
- **GET** `/api/v11/live/validators` - Live validator data

#### WebSocket Endpoints
1. **`/ws/transactions`** - Real-time transaction updates
2. **`/ws/validators`** - Validator status changes
3. **`/ws/consensus`** - Consensus protocol events
4. **`/ws/network`** - Network topology updates
5. **`/ws/metrics`** - Performance metrics streaming
6. **`/ws/channels`** - Multi-channel updates
7. **`/api/v11/live/stream`** - Unified live data stream

---

## Phase 1: Authentication Integration (Week 1)

### Duration: 8-12 hours
### Priority: Critical

### 1.1 Backend Authentication Analysis

The backend uses **session-based authentication** with cookies:
- Session ID stored in `Set-Cookie: session_id=...`
- Sessions expire after 8 hours (28800 seconds)
- BCrypt password hashing
- Session validation via `/login/verify` endpoint

### 1.2 Files to Modify

#### Core Files (Must Modify)
```
enterprise-portal/src/
├── services/
│   └── api.ts                    # API client configuration
├── store/
│   └── authSlice.ts              # Redux authentication state
├── pages/
│   └── Login.tsx                 # Login form component
└── App.tsx                       # Protected route wrapper
```

### 1.3 Implementation Steps

#### Step 1: Update API Client for Session Authentication (2 hours)

**File:** `enterprise-portal/src/services/api.ts`

**Current Implementation:**
```typescript
// Line 16-32: Request interceptor with Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // ...
})
```

**Required Changes:**
1. **Add cookie credentials support:**
```typescript
// Update apiClient configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true, // ✅ Enable sending cookies with requests
})
```

2. **Update request interceptor to handle both session and token auth:**
```typescript
apiClient.interceptors.request.use((config) => {
  // Session auth takes priority (if session_id cookie exists, it's sent automatically)

  // Fallback to Bearer token for API key endpoints
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // Add API key for rate-limited endpoints
  const apiKey = import.meta.env.VITE_REACT_APP_API_KEY
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }

  return config
})
```

3. **Update 401 error handler to clear session:**
```typescript
// Line 50-57: Enhanced 401 handling
case 401:
  console.error(`401 Unauthorized on ${url}`)
  // Clear both session storage and localStorage
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  // Session cookie is cleared by backend, but ensure local state is clean
  if (typeof window !== 'undefined') {
    // Dispatch logout action to clear Redux state
    store.dispatch(logout())
    window.location.href = '/login'
  }
  return Promise.reject(new Error('Session expired. Please log in again.'))
```

**Success Criteria:**
- Axios sends cookies with every request
- 401 responses clear both token and session
- API calls include credentials

---

#### Step 2: Update Login Component (2 hours)

**File:** `enterprise-portal/src/pages/Login.tsx`

**Current Implementation:**
```typescript
// Line 39: Calls /users/authenticate (WRONG endpoint)
const response = await fetch(`${API_BASE_URL}/users/authenticate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})
```

**Required Changes:**

1. **Fix authentication endpoint:**
```typescript
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')
  setIsLoading(true)

  try {
    console.log('🔐 Sending authentication request to backend...')

    // ✅ CORRECT ENDPOINT: /login/authenticate (not /users/authenticate)
    const response = await fetch(`${API_BASE_URL}/login/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ✅ Important: Include cookies in request
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim()
      })
    })

    console.log('📡 Backend response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Authentication failed' }))
      const errorMessage = errorData.error || 'Invalid username or password'
      console.error('❌ Authentication failed:', errorMessage)
      setError(errorMessage)
      setIsLoading(false)
      return
    }

    // Backend returns: { sessionId, username, success, message }
    const authResponse = await response.json()
    console.log('✅ Authentication successful:', authResponse.username)

    // Extract session ID from Set-Cookie header (automatically handled by browser)
    // Store user data in Redux
    dispatch(loginSuccess({
      user: {
        id: authResponse.sessionId, // Use sessionId as user ID
        username: authResponse.username,
        role: 'USER' // Backend doesn't return role in current version
      },
      token: authResponse.sessionId // Store sessionId as token for compatibility
    }))

    console.log('✅ Login dispatched, navigating to dashboard...')
    navigate('/')
  } catch (err) {
    const errorMsg = err instanceof Error
      ? err.message
      : 'Connection error. Please check if the backend is running on port 9003.'
    console.error('❌ Login error:', errorMsg)
    setError(errorMsg)
  } finally {
    setIsLoading(false)
  }
}
```

2. **Update test credentials display:**
```typescript
<Typography variant="body2" sx={{ mt: 2, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
  Test credentials: demo / demo123 (or admin / AdminPassword123!)
</Typography>
```

**Success Criteria:**
- Login form calls correct endpoint (`/login/authenticate`)
- Browser stores session cookie automatically
- Redux state updates with user data
- User is redirected to dashboard on success

---

#### Step 3: Add Session Verification on App Load (3 hours)

**File:** `enterprise-portal/src/App.tsx`

**Current Implementation:**
```typescript
// Line 57-67: No session verification on load
if (isLoading) {
  return (
    <Box>Loading...</Box>
  )
}
```

**Required Changes:**

1. **Add session verification effect:**
```typescript
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './hooks'
import { loginSuccess, logout } from './store/authSlice'
import { apiService } from './services/api'

function App() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  const [isVerifying, setIsVerifying] = React.useState(true)

  // Verify session on app load
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Check if user has localStorage auth data
        const savedUser = localStorage.getItem('auth_user')
        const savedToken = localStorage.getItem('auth_token')

        if (!savedUser || !savedToken) {
          setIsVerifying(false)
          return
        }

        // Verify session with backend
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9003/api/v11'}/login/verify`, {
          method: 'GET',
          credentials: 'include', // Send session cookie
        })

        if (response.ok) {
          const sessionData = await response.json()
          // Session is valid, restore Redux state
          dispatch(loginSuccess({
            user: JSON.parse(savedUser),
            token: savedToken
          }))
          console.log('✅ Session verified, user logged in')
        } else {
          // Session expired, clear local storage
          console.warn('⚠️ Session expired, clearing auth state')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
          dispatch(logout())
        }
      } catch (error) {
        console.error('❌ Session verification failed:', error)
        // On error, clear auth state
        dispatch(logout())
      } finally {
        setIsVerifying(false)
      }
    }

    verifySession()
  }, [dispatch])

  // Show loading spinner during verification
  if (isVerifying) {
    return (
      <Box sx={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Verifying session...</Typography>
      </Box>
    )
  }

  return (
    <ErrorBoundary>
      {/* ... existing routes ... */}
    </ErrorBoundary>
  )
}
```

**Success Criteria:**
- App verifies session on page load
- Valid sessions restore user state
- Expired sessions redirect to login
- Loading state prevents route flashing

---

#### Step 4: Add Logout Functionality (1 hour)

**File:** `enterprise-portal/src/components/Layout.tsx` (or wherever logout button is)

**Implementation:**
```typescript
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { logout } from '../store/authSlice'

const handleLogout = async () => {
  try {
    // Call backend logout endpoint
    await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:9003/api/v11'}/login/logout`, {
      method: 'POST',
      credentials: 'include', // Send session cookie for invalidation
    })

    // Clear Redux state and localStorage
    dispatch(logout())

    console.log('✅ Logged out successfully')

    // Redirect to login
    navigate('/login')
  } catch (error) {
    console.error('❌ Logout error:', error)
    // Still clear local state even if backend call fails
    dispatch(logout())
    navigate('/login')
  }
}
```

**Success Criteria:**
- Logout button calls backend `/login/logout`
- Session cookie is invalidated
- Redux state is cleared
- User is redirected to login page

---

#### Step 5: Update Redux Auth Slice (2 hours)

**File:** `enterprise-portal/src/store/authSlice.ts`

**Current Implementation:**
```typescript
// Line 44-48: Simple boolean authentication
const initialState: AuthState = {
  isAuthenticated: !!savedToken && !!parsedUser,
  isLoading: false,
  user: parsedUser,
  token: savedToken,
}
```

**Required Changes:**

1. **Add session expiration tracking:**
```typescript
interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id: string
    username: string
    role: string
  } | null
  token: string | null
  sessionExpiresAt: number | null // ✅ Add expiration timestamp
}

const initialState: AuthState = {
  isAuthenticated: !!savedToken && !!parsedUser,
  isLoading: false,
  user: parsedUser,
  token: savedToken,
  sessionExpiresAt: null,
}
```

2. **Update loginSuccess to track expiration:**
```typescript
loginSuccess: (state, action: PayloadAction<{
  user: any;
  token: string;
  expiresIn?: number; // Optional: seconds until expiration (default 8 hours)
}>) => {
  state.isAuthenticated = true
  state.user = action.payload.user
  state.token = action.payload.token

  // Calculate expiration time (8 hours from now if not specified)
  const expiresIn = action.payload.expiresIn || 28800 // 8 hours in seconds
  state.sessionExpiresAt = Date.now() + (expiresIn * 1000)

  // Persist to localStorage
  try {
    localStorage.setItem('auth_token', action.payload.token)
    localStorage.setItem('auth_user', JSON.stringify(action.payload.user))
    localStorage.setItem('session_expires', state.sessionExpiresAt.toString())
  } catch (e) {
    console.warn('⚠️ Unable to persist auth to localStorage')
  }
}
```

3. **Add session expiration checker:**
```typescript
// Add a new action to check if session is expired
checkSessionExpiration: (state) => {
  if (state.sessionExpiresAt && Date.now() > state.sessionExpiresAt) {
    // Session has expired
    state.isAuthenticated = false
    state.user = null
    state.token = null
    state.sessionExpiresAt = null

    try {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      localStorage.removeItem('session_expires')
    } catch (e) {
      console.warn('⚠️ Unable to clear localStorage')
    }
  }
}
```

**Success Criteria:**
- Auth state tracks session expiration
- Expired sessions are automatically invalidated
- Session data persists across page refreshes

---

### 1.4 Testing Procedures

#### Manual Testing Checklist
```bash
# 1. Start backend
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev

# 2. Start frontend
cd enterprise-portal
npm run dev

# 3. Test authentication flow
✅ Navigate to http://localhost:3000/login
✅ Enter credentials: demo / demo123
✅ Verify redirect to dashboard on success
✅ Check browser DevTools > Application > Cookies for session_id
✅ Verify API calls include credentials in Network tab
✅ Refresh page - should remain logged in
✅ Click logout - should clear session and redirect to login
✅ Try accessing /dashboard directly - should redirect to login
```

#### Automated Testing
```typescript
// enterprise-portal/src/__tests__/auth/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '../../store'
import Login from '../../pages/Login'

describe('Login Component', () => {
  it('should call /login/authenticate endpoint with correct credentials', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sessionId: 'test-session-123',
          username: 'demo',
          success: true,
          message: 'Login successful'
        }),
      })
    ) as jest.Mock

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    )

    // Enter credentials
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'demo' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'demo123' } })

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    // Verify fetch was called with correct endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login/authenticate'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ username: 'demo', password: 'demo123' })
        })
      )
    })
  })

  it('should handle 401 unauthorized error', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })
    ) as jest.Mock

    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    )

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})
```

---

### 1.5 Success Criteria

- ✅ Login form authenticates against `/login/authenticate` endpoint
- ✅ Session cookie is automatically stored by browser
- ✅ All API requests include `credentials: 'include'`
- ✅ 401 errors clear session and redirect to login
- ✅ Session persists across page refreshes
- ✅ Logout clears session on backend and frontend
- ✅ Protected routes require valid session
- ✅ Unit tests pass for authentication flow

---

### 1.6 Effort Breakdown

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Update API client configuration | 2 | Critical |
| Fix Login component endpoint | 2 | Critical |
| Add session verification on load | 3 | Critical |
| Implement logout functionality | 1 | High |
| Update Redux auth slice | 2 | High |
| Manual testing | 1.5 | High |
| Write automated tests | 1.5 | Medium |
| **Total** | **12 hours** | |

---

## Phase 2: Real-time Features (Week 2)

### Duration: 12-16 hours
### Priority: High

### 2.1 WebSocket Integration Overview

The backend provides **7 WebSocket endpoints** for real-time updates:

| Endpoint | Path | Purpose | Message Format |
|----------|------|---------|----------------|
| Transactions | `/ws/transactions` | New transaction events | `TransactionMessage` |
| Validators | `/ws/validators` | Validator status changes | `ValidatorMessage` |
| Consensus | `/ws/consensus` | Consensus events | `ConsensusMessage` |
| Network | `/ws/network` | Network topology updates | `NetworkMessage` |
| Metrics | `/ws/metrics` | Performance metrics | `MetricsMessage` |
| Channels | `/ws/channels` | Multi-channel updates | `ChannelMessage` |
| Live Stream | `/api/v11/live/stream` | Unified live data | `WebSocketMessage` |

---

### 2.2 WebSocket Service Architecture

**File:** `enterprise-portal/src/services/websocket.ts` (NEW FILE)

```typescript
/**
 * WebSocket Service for Aurigraph V11
 *
 * Manages WebSocket connections for real-time data streaming
 * Supports automatic reconnection, message subscriptions, and error handling
 */

import { store } from '../store'
import { logout } from '../store/authSlice'

export enum WebSocketChannel {
  TRANSACTIONS = 'transactions',
  VALIDATORS = 'validators',
  CONSENSUS = 'consensus',
  NETWORK = 'network',
  METRICS = 'metrics',
  CHANNELS = 'channels',
  LIVE_STREAM = 'live_stream',
}

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
}

type MessageHandler = (message: WebSocketMessage) => void

export class AurigraphWebSocketService {
  private connections: Map<WebSocketChannel, WebSocket> = new Map()
  private handlers: Map<WebSocketChannel, Set<MessageHandler>> = new Map()
  private reconnectAttempts: Map<WebSocketChannel, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000 // 3 seconds base delay

  private readonly wsBaseUrl: string

  constructor() {
    const protocol = import.meta.env.PROD ? 'wss' : 'ws'
    const host = import.meta.env.PROD ? 'dlt.aurigraph.io' : 'localhost:9003'
    this.wsBaseUrl = `${protocol}://${host}`
  }

  /**
   * Connect to a WebSocket channel
   */
  connect(channel: WebSocketChannel): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already connected
      if (this.connections.has(channel)) {
        const ws = this.connections.get(channel)!
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`[WebSocket] Already connected to ${channel}`)
          resolve()
          return
        }
      }

      const endpoint = this.getEndpointForChannel(channel)
      const url = `${this.wsBaseUrl}${endpoint}`

      console.log(`[WebSocket] Connecting to ${channel}: ${url}`)

      try {
        const ws = new WebSocket(url)

        ws.onopen = () => {
          console.log(`[WebSocket] Connected to ${channel}`)
          this.reconnectAttempts.set(channel, 0)
          this.connections.set(channel, ws)
          resolve()
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage
            console.log(`[WebSocket] Message from ${channel}:`, data.type)

            // Call all registered handlers for this channel
            const handlers = this.handlers.get(channel)
            if (handlers) {
              handlers.forEach(handler => handler(data))
            }
          } catch (error) {
            console.error(`[WebSocket] Failed to parse message from ${channel}:`, error)
          }
        }

        ws.onerror = (error) => {
          console.error(`[WebSocket] Error on ${channel}:`, error)
          reject(error)
        }

        ws.onclose = (event) => {
          console.log(`[WebSocket] Disconnected from ${channel} (code: ${event.code})`)
          this.connections.delete(channel)

          // Attempt reconnection
          this.attemptReconnect(channel)
        }
      } catch (error) {
        console.error(`[WebSocket] Failed to create connection to ${channel}:`, error)
        reject(error)
      }
    })
  }

  /**
   * Disconnect from a WebSocket channel
   */
  disconnect(channel: WebSocketChannel): void {
    const ws = this.connections.get(channel)
    if (ws) {
      console.log(`[WebSocket] Disconnecting from ${channel}`)
      ws.close()
      this.connections.delete(channel)
      this.handlers.delete(channel)
    }
  }

  /**
   * Disconnect from all channels
   */
  disconnectAll(): void {
    console.log('[WebSocket] Disconnecting all channels')
    this.connections.forEach((ws, channel) => {
      this.disconnect(channel)
    })
  }

  /**
   * Subscribe to messages from a channel
   */
  subscribe(channel: WebSocketChannel, handler: MessageHandler): () => void {
    // Create handler set if it doesn't exist
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set())
    }

    // Add handler
    const handlers = this.handlers.get(channel)!
    handlers.add(handler)

    console.log(`[WebSocket] Subscribed to ${channel} (${handlers.size} handlers)`)

    // Return unsubscribe function
    return () => {
      handlers.delete(handler)
      console.log(`[WebSocket] Unsubscribed from ${channel} (${handlers.size} handlers remaining)`)
    }
  }

  /**
   * Send a message to a channel
   */
  send(channel: WebSocketChannel, message: WebSocketMessage): void {
    const ws = this.connections.get(channel)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      console.log(`[WebSocket] Sent message to ${channel}:`, message.type)
    } else {
      console.warn(`[WebSocket] Cannot send message - ${channel} is not connected`)
    }
  }

  /**
   * Check if a channel is connected
   */
  isConnected(channel: WebSocketChannel): boolean {
    const ws = this.connections.get(channel)
    return ws !== undefined && ws.readyState === WebSocket.OPEN
  }

  /**
   * Get connection status for all channels
   */
  getConnectionStatus(): Record<WebSocketChannel, boolean> {
    const status: Record<string, boolean> = {}
    Object.values(WebSocketChannel).forEach(channel => {
      status[channel] = this.isConnected(channel)
    })
    return status as Record<WebSocketChannel, boolean>
  }

  /**
   * Attempt to reconnect to a channel with exponential backoff
   */
  private attemptReconnect(channel: WebSocketChannel): void {
    const attempts = this.reconnectAttempts.get(channel) || 0

    if (attempts >= this.maxReconnectAttempts) {
      console.error(`[WebSocket] Max reconnect attempts reached for ${channel}`)
      return
    }

    const delay = this.reconnectDelay * Math.pow(2, attempts)
    console.log(`[WebSocket] Reconnecting to ${channel} in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`)

    this.reconnectAttempts.set(channel, attempts + 1)

    setTimeout(() => {
      console.log(`[WebSocket] Reconnecting to ${channel}...`)
      this.connect(channel).catch(error => {
        console.error(`[WebSocket] Reconnection failed for ${channel}:`, error)
      })
    }, delay)
  }

  /**
   * Map channel enum to WebSocket endpoint path
   */
  private getEndpointForChannel(channel: WebSocketChannel): string {
    const endpoints: Record<WebSocketChannel, string> = {
      [WebSocketChannel.TRANSACTIONS]: '/ws/transactions',
      [WebSocketChannel.VALIDATORS]: '/ws/validators',
      [WebSocketChannel.CONSENSUS]: '/ws/consensus',
      [WebSocketChannel.NETWORK]: '/ws/network',
      [WebSocketChannel.METRICS]: '/ws/metrics',
      [WebSocketChannel.CHANNELS]: '/ws/channels',
      [WebSocketChannel.LIVE_STREAM]: '/api/v11/live/stream',
    }
    return endpoints[channel]
  }
}

// Export singleton instance
export const websocketService = new AurigraphWebSocketService()
```

---

### 2.3 React Hook for WebSocket Subscriptions

**File:** `enterprise-portal/src/hooks/useWebSocket.ts` (NEW FILE)

```typescript
/**
 * Custom React hook for WebSocket subscriptions
 *
 * Usage:
 * const { data, isConnected } = useWebSocket(WebSocketChannel.TRANSACTIONS, (message) => {
 *   console.log('New transaction:', message)
 * })
 */

import { useEffect, useState, useCallback } from 'react'
import { websocketService, WebSocketChannel, WebSocketMessage } from '../services/websocket'

interface UseWebSocketReturn<T = any> {
  data: T | null
  isConnected: boolean
  error: Error | null
  reconnect: () => void
}

export function useWebSocket<T = any>(
  channel: WebSocketChannel,
  onMessage?: (message: WebSocketMessage) => void
): UseWebSocketReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Connect to WebSocket on mount
  useEffect(() => {
    let mounted = true

    const connect = async () => {
      try {
        await websocketService.connect(channel)
        if (mounted) {
          setIsConnected(true)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
          setIsConnected(false)
        }
      }
    }

    connect()

    // Cleanup on unmount
    return () => {
      mounted = false
      websocketService.disconnect(channel)
    }
  }, [channel])

  // Subscribe to messages
  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      setData(message.payload as T)
      if (onMessage) {
        onMessage(message)
      }
    }

    const unsubscribe = websocketService.subscribe(channel, handler)

    return () => {
      unsubscribe()
    }
  }, [channel, onMessage])

  // Check connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = websocketService.isConnected(channel)
      setIsConnected(connected)
    }, 1000)

    return () => clearInterval(interval)
  }, [channel])

  const reconnect = useCallback(() => {
    websocketService.connect(channel).catch(err => {
      setError(err as Error)
    })
  }, [channel])

  return { data, isConnected, error, reconnect }
}
```

---

### 2.4 React Components for Real-time Data

#### Example 1: Live Transaction Feed

**File:** `enterprise-portal/src/components/LiveTransactionFeed.tsx` (NEW FILE)

```typescript
import { useState } from 'react'
import { Box, Card, Typography, Chip, List, ListItem, ListItemText } from '@mui/material'
import { useWebSocket } from '../hooks/useWebSocket'
import { WebSocketChannel } from '../services/websocket'

interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

export default function LiveTransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const { isConnected } = useWebSocket<Transaction>(
    WebSocketChannel.TRANSACTIONS,
    (message) => {
      // Handle new transaction
      if (message.type === 'NEW_TRANSACTION') {
        setTransactions(prev => [message.payload, ...prev].slice(0, 50)) // Keep last 50
      }
    }
  )

  return (
    <Card sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Live Transactions</Typography>
        <Chip
          label={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'success' : 'error'}
          size="small"
        />
      </Box>

      <List>
        {transactions.map(tx => (
          <ListItem key={tx.id}>
            <ListItemText
              primary={`${tx.from.substring(0, 8)}... → ${tx.to.substring(0, 8)}...`}
              secondary={`${tx.amount} AUR | ${new Date(tx.timestamp).toLocaleTimeString()}`}
            />
            <Chip
              label={tx.status}
              color={tx.status === 'confirmed' ? 'success' : 'warning'}
              size="small"
            />
          </ListItem>
        ))}
      </List>
    </Card>
  )
}
```

#### Example 2: Live Metrics Dashboard

**File:** `enterprise-portal/src/components/LiveMetricsDashboard.tsx` (NEW FILE)

```typescript
import { Box, Card, Typography, Grid } from '@mui/material'
import { useWebSocket } from '../hooks/useWebSocket'
import { WebSocketChannel } from '../services/websocket'

interface MetricsData {
  tps: number
  blockHeight: number
  activeNodes: number
  networkLatency: number
}

export default function LiveMetricsDashboard() {
  const { data: metrics, isConnected } = useWebSocket<MetricsData>(
    WebSocketChannel.METRICS
  )

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            TPS (Transactions/sec)
          </Typography>
          <Typography variant="h4">
            {metrics?.tps?.toLocaleString() || '0'}
          </Typography>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Block Height
          </Typography>
          <Typography variant="h4">
            {metrics?.blockHeight?.toLocaleString() || '0'}
          </Typography>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Active Nodes
          </Typography>
          <Typography variant="h4">
            {metrics?.activeNodes || '0'}
          </Typography>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Network Latency
          </Typography>
          <Typography variant="h4">
            {metrics?.networkLatency || '0'} ms
          </Typography>
        </Card>
      </Grid>
    </Grid>
  )
}
```

---

### 2.5 WebSocket Message Subscription Patterns

#### Pattern 1: Component-Level Subscription
```typescript
// Best for: Single component needs real-time data
function MyComponent() {
  const { data } = useWebSocket(WebSocketChannel.VALIDATORS)
  return <div>{JSON.stringify(data)}</div>
}
```

#### Pattern 2: Redux Integration
```typescript
// Best for: Shared state across multiple components

// store/liveDataSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface LiveDataState {
  tps: number
  validators: any[]
  transactions: any[]
}

const liveDataSlice = createSlice({
  name: 'liveData',
  initialState: {
    tps: 0,
    validators: [],
    transactions: [],
  } as LiveDataState,
  reducers: {
    updateTPS: (state, action: PayloadAction<number>) => {
      state.tps = action.payload
    },
    addTransaction: (state, action: PayloadAction<any>) => {
      state.transactions = [action.payload, ...state.transactions].slice(0, 100)
    },
    updateValidators: (state, action: PayloadAction<any[]>) => {
      state.validators = action.payload
    },
  },
})

export const { updateTPS, addTransaction, updateValidators } = liveDataSlice.actions
export default liveDataSlice.reducer

// App.tsx - Subscribe at app level
import { useEffect } from 'react'
import { websocketService, WebSocketChannel } from './services/websocket'
import { useAppDispatch } from './hooks'
import { updateTPS, addTransaction } from './store/liveDataSlice'

function App() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Connect to all channels on app start
    websocketService.connect(WebSocketChannel.TRANSACTIONS)
    websocketService.connect(WebSocketChannel.METRICS)

    // Subscribe to transaction updates
    const unsubTx = websocketService.subscribe(
      WebSocketChannel.TRANSACTIONS,
      (message) => {
        if (message.type === 'NEW_TRANSACTION') {
          dispatch(addTransaction(message.payload))
        }
      }
    )

    // Subscribe to metrics updates
    const unsubMetrics = websocketService.subscribe(
      WebSocketChannel.METRICS,
      (message) => {
        if (message.type === 'TPS_UPDATE') {
          dispatch(updateTPS(message.payload.tps))
        }
      }
    )

    return () => {
      unsubTx()
      unsubMetrics()
      websocketService.disconnectAll()
    }
  }, [dispatch])

  return <div>{/* App content */}</div>
}
```

#### Pattern 3: Selective Subscription
```typescript
// Best for: Conditional subscriptions based on user actions

function ValidatorDetailsPage({ validatorId }: { validatorId: string }) {
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (subscribed) {
      websocketService.connect(WebSocketChannel.VALIDATORS)

      const unsubscribe = websocketService.subscribe(
        WebSocketChannel.VALIDATORS,
        (message) => {
          if (message.payload.validatorId === validatorId) {
            console.log('Validator updated:', message.payload)
          }
        }
      )

      return () => unsubscribe()
    }
  }, [subscribed, validatorId])

  return (
    <div>
      <button onClick={() => setSubscribed(!subscribed)}>
        {subscribed ? 'Unsubscribe' : 'Subscribe to live updates'}
      </button>
    </div>
  )
}
```

---

### 2.6 Reconnection Logic

The WebSocket service includes automatic reconnection with exponential backoff:

**Features:**
- ✅ Automatic reconnection on connection loss
- ✅ Exponential backoff (3s, 6s, 12s, 24s, 48s)
- ✅ Max 5 reconnection attempts
- ✅ Connection status monitoring
- ✅ Graceful error handling

**Monitoring Reconnections:**
```typescript
// Add to your component
const [connectionStatus, setConnectionStatus] = useState<Record<WebSocketChannel, boolean>>({})

useEffect(() => {
  const interval = setInterval(() => {
    setConnectionStatus(websocketService.getConnectionStatus())
  }, 1000)

  return () => clearInterval(interval)
}, [])

// Display connection status
<Box>
  {Object.entries(connectionStatus).map(([channel, connected]) => (
    <Chip
      key={channel}
      label={`${channel}: ${connected ? 'Connected' : 'Disconnected'}`}
      color={connected ? 'success' : 'error'}
    />
  ))}
</Box>
```

---

### 2.7 State Management for Real-time Data

**File:** `enterprise-portal/src/store/liveDataSlice.ts` (NEW FILE)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  timestamp: number
  status: string
}

interface Validator {
  id: string
  name: string
  status: 'active' | 'inactive' | 'jailed'
  votingPower: number
  uptime: number
}

interface LiveDataState {
  transactions: Transaction[]
  validators: Validator[]
  metrics: {
    tps: number
    blockHeight: number
    activeNodes: number
    networkLatency: number
  }
  consensus: {
    round: number
    phase: string
    proposer: string
  }
  network: {
    totalNodes: number
    activeConnections: number
    averageLatency: number
  }
}

const initialState: LiveDataState = {
  transactions: [],
  validators: [],
  metrics: {
    tps: 0,
    blockHeight: 0,
    activeNodes: 0,
    networkLatency: 0,
  },
  consensus: {
    round: 0,
    phase: 'idle',
    proposer: '',
  },
  network: {
    totalNodes: 0,
    activeConnections: 0,
    averageLatency: 0,
  },
}

const liveDataSlice = createSlice({
  name: 'liveData',
  initialState,
  reducers: {
    // Transaction actions
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions = [action.payload, ...state.transactions].slice(0, 100)
    },
    clearTransactions: (state) => {
      state.transactions = []
    },

    // Validator actions
    updateValidators: (state, action: PayloadAction<Validator[]>) => {
      state.validators = action.payload
    },
    updateValidator: (state, action: PayloadAction<Validator>) => {
      const index = state.validators.findIndex(v => v.id === action.payload.id)
      if (index !== -1) {
        state.validators[index] = action.payload
      } else {
        state.validators.push(action.payload)
      }
    },

    // Metrics actions
    updateMetrics: (state, action: PayloadAction<Partial<LiveDataState['metrics']>>) => {
      state.metrics = { ...state.metrics, ...action.payload }
    },
    updateTPS: (state, action: PayloadAction<number>) => {
      state.metrics.tps = action.payload
    },

    // Consensus actions
    updateConsensus: (state, action: PayloadAction<Partial<LiveDataState['consensus']>>) => {
      state.consensus = { ...state.consensus, ...action.payload }
    },

    // Network actions
    updateNetwork: (state, action: PayloadAction<Partial<LiveDataState['network']>>) => {
      state.network = { ...state.network, ...action.payload }
    },

    // Reset all live data
    resetLiveData: () => initialState,
  },
})

export const {
  addTransaction,
  clearTransactions,
  updateValidators,
  updateValidator,
  updateMetrics,
  updateTPS,
  updateConsensus,
  updateNetwork,
  resetLiveData,
} = liveDataSlice.actions

export default liveDataSlice.reducer
```

**Update store configuration:**
```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import liveDataReducer from './liveDataSlice' // ✅ Add this

export const store = configureStore({
  reducer: {
    auth: authReducer,
    liveData: liveDataReducer, // ✅ Add this
    // ... other reducers
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

---

### 2.8 Success Criteria

- ✅ WebSocket service connects to all 7 endpoints
- ✅ Real-time data updates appear in UI without refresh
- ✅ Automatic reconnection works on connection loss
- ✅ No memory leaks from WebSocket subscriptions
- ✅ Connection status is visible to users
- ✅ Redux state updates in real-time
- ✅ Components unsubscribe on unmount

---

### 2.9 Effort Breakdown

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Create WebSocket service class | 3 | Critical |
| Create useWebSocket React hook | 2 | Critical |
| Build LiveTransactionFeed component | 2 | High |
| Build LiveMetricsDashboard component | 2 | High |
| Create Redux liveDataSlice | 2 | High |
| Integrate WebSocket with Redux | 2 | High |
| Add connection status monitoring | 1 | Medium |
| Manual testing | 2 | High |
| Write automated tests | 2 | Medium |
| **Total** | **16 hours** | |

---

## Phase 3: Quality Assurance (Week 3)

### Duration: 10+ hours
### Priority: High

### 3.1 E2E Testing Framework Selection

#### Recommended: Playwright

**Reasons:**
- ✅ Better WebSocket support than Cypress
- ✅ Built-in wait strategies for async operations
- ✅ Parallel test execution
- ✅ Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ Better documentation and TypeScript support
- ✅ Faster execution than Cypress

**Installation:**
```bash
cd enterprise-portal
npm install -D @playwright/test
npx playwright install
```

---

### 3.2 Test Scenarios

#### Authentication Test Suite

**File:** `enterprise-portal/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login')
  })

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="username"]', 'demo')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')

    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/')

    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText('Dashboard')

    // Verify session cookie exists
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'session_id')
    expect(sessionCookie).toBeDefined()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('input[name="username"]', 'invalid')
    await page.fill('input[name="password"]', 'wrong')
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials')

    // Should still be on login page
    expect(page.url()).toBe('http://localhost:3000/login')
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[name="username"]', 'demo')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/')

    // Click logout button
    await page.click('button[aria-label="Logout"]')

    // Wait for redirect to login
    await page.waitForURL('http://localhost:3000/login')

    // Verify session cookie cleared
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find(c => c.name === 'session_id')
    expect(sessionCookie).toBeUndefined()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('http://localhost:3000/dashboard')

    // Should redirect to login
    await page.waitForURL('http://localhost:3000/login')
  })

  test('should persist session after page refresh', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'demo')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/')

    // Refresh page
    await page.reload()

    // Should still be on dashboard
    expect(page.url()).toBe('http://localhost:3000/')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })
})
```

---

#### Demo Management Test Suite

**File:** `enterprise-portal/e2e/demos.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Demo Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="username"]', 'demo')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/')
  })

  test('should display demo list', async ({ page }) => {
    // Navigate to demos page
    await page.click('text=Demos')
    await page.waitForURL('**/demo')

    // Verify demo list loads
    await expect(page.locator('[data-testid="demo-list"]')).toBeVisible()
  })

  test('should create new demo', async ({ page }) => {
    await page.goto('http://localhost:3000/demo')

    // Click create demo button
    await page.click('button:has-text("Create Demo")')

    // Fill demo form
    await page.fill('input[name="demoName"]', 'E2E Test Demo')
    await page.fill('input[name="userEmail"]', 'test@example.com')
    await page.fill('input[name="userName"]', 'Test User')
    await page.fill('textarea[name="description"]', 'Created by E2E test')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for success message
    await expect(page.locator('text=Demo created successfully')).toBeVisible()

    // Verify demo appears in list
    await expect(page.locator('text=E2E Test Demo')).toBeVisible()
  })

  test('should start and stop demo', async ({ page }) => {
    await page.goto('http://localhost:3000/demo')

    // Find first demo and click start
    await page.click('[data-testid="demo-card"]:first-child button:has-text("Start")')

    // Wait for status to change to "Running"
    await expect(page.locator('[data-testid="demo-card"]:first-child [data-testid="status"]'))
      .toContainText('Running')

    // Click stop
    await page.click('[data-testid="demo-card"]:first-child button:has-text("Stop")')

    // Wait for status to change to "Stopped"
    await expect(page.locator('[data-testid="demo-card"]:first-child [data-testid="status"]'))
      .toContainText('Stopped')
  })

  test('should delete demo', async ({ page }) => {
    await page.goto('http://localhost:3000/demo')

    // Get initial demo count
    const initialCount = await page.locator('[data-testid="demo-card"]').count()

    // Click delete on first demo
    await page.click('[data-testid="demo-card"]:first-child button[aria-label="Delete"]')

    // Confirm deletion
    await page.click('button:has-text("Confirm")')

    // Wait for demo to be removed
    await page.waitForTimeout(500)

    // Verify demo count decreased
    const newCount = await page.locator('[data-testid="demo-card"]').count()
    expect(newCount).toBe(initialCount - 1)
  })
})
```

---

#### WebSocket Real-time Updates Test Suite

**File:** `enterprise-portal/e2e/websockets.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('WebSocket Real-time Updates', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('input[name="username"]', 'demo')
    await page.fill('input[name="password"]', 'demo123')
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3000/')
  })

  test('should connect to transaction WebSocket', async ({ page }) => {
    // Navigate to dashboard with live transactions
    await page.goto('http://localhost:3000/')

    // Wait for WebSocket connection indicator
    await expect(page.locator('[data-testid="ws-status-transactions"]'))
      .toContainText('Connected', { timeout: 10000 })
  })

  test('should receive live transaction updates', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Get initial transaction count
    const initialCount = await page.locator('[data-testid="transaction-item"]').count()

    // Wait for new transactions (backend generates every 5 seconds)
    await page.waitForTimeout(10000)

    // Verify new transactions appeared
    const newCount = await page.locator('[data-testid="transaction-item"]').count()
    expect(newCount).toBeGreaterThan(initialCount)
  })

  test('should update TPS metric in real-time', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Get initial TPS value
    const initialTPS = await page.locator('[data-testid="tps-metric"]').textContent()

    // Wait for metric update
    await page.waitForTimeout(5000)

    // Get updated TPS value
    const newTPS = await page.locator('[data-testid="tps-metric"]').textContent()

    // Verify TPS changed
    expect(newTPS).not.toBe(initialTPS)
  })

  test('should reconnect after connection loss', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Wait for connection
    await expect(page.locator('[data-testid="ws-status-transactions"]'))
      .toContainText('Connected', { timeout: 10000 })

    // Simulate connection loss (close WebSocket via console)
    await page.evaluate(() => {
      // @ts-ignore
      window.__websocketService?.disconnect('transactions')
    })

    // Wait for disconnected status
    await expect(page.locator('[data-testid="ws-status-transactions"]'))
      .toContainText('Disconnected', { timeout: 5000 })

    // Wait for automatic reconnection
    await expect(page.locator('[data-testid="ws-status-transactions"]'))
      .toContainText('Connected', { timeout: 30000 })
  })

  test('should handle multiple WebSocket channels', async ({ page }) => {
    await page.goto('http://localhost:3000/')

    // Verify all channels are connected
    const channels = ['transactions', 'validators', 'metrics', 'consensus']

    for (const channel of channels) {
      await expect(page.locator(`[data-testid="ws-status-${channel}"]`))
        .toContainText('Connected', { timeout: 10000 })
    }
  })
})
```

---

### 3.3 CI/CD Integration

**File:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: aurigraph_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Java 21
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Setup Node.js 20
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install backend dependencies
        run: ./mvnw clean install -DskipTests
        working-directory: ./aurigraph-v11-standalone

      - name: Start backend
        run: |
          ./mvnw quarkus:dev &
          echo $! > backend.pid
        working-directory: ./aurigraph-v11-standalone

      - name: Wait for backend to be ready
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:9003/q/health; do sleep 2; done'

      - name: Install frontend dependencies
        run: npm ci
        working-directory: ./enterprise-portal

      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: ./enterprise-portal

      - name: Run E2E tests
        run: npm run test:e2e
        working-directory: ./enterprise-portal
        env:
          CI: true

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results
          path: enterprise-portal/test-results/

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: enterprise-portal/playwright-report/

      - name: Stop backend
        if: always()
        run: kill $(cat backend.pid) || true
        working-directory: ./aurigraph-v11-standalone
```

**Add to `enterprise-portal/package.json`:**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

### 3.4 Visual Regression Testing (Optional)

**Install Percy (or similar):**
```bash
npm install -D @percy/cli @percy/playwright
```

**Update test to capture screenshots:**
```typescript
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test('dashboard visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  await page.fill('input[name="username"]', 'demo')
  await page.fill('input[name="password"]', 'demo123')
  await page.click('button[type="submit"]')
  await page.waitForURL('http://localhost:3000/')

  // Capture dashboard screenshot
  await percySnapshot(page, 'Dashboard - Main View')
})
```

---

### 3.5 Success Criteria

- ✅ All authentication tests pass
- ✅ All demo management tests pass
- ✅ All WebSocket tests pass
- ✅ Tests run in CI/CD pipeline
- ✅ Test coverage > 80% for critical flows
- ✅ Visual regression tests detect UI changes
- ✅ Tests execute in under 5 minutes

---

### 3.6 Effort Breakdown

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Setup Playwright framework | 1 | Critical |
| Write authentication tests | 2 | Critical |
| Write demo management tests | 2 | High |
| Write WebSocket tests | 2 | High |
| CI/CD pipeline configuration | 2 | High |
| Visual regression tests setup | 1 | Medium |
| Test maintenance documentation | 1 | Medium |
| **Total** | **11 hours** | |

---

## Phase 4: Risk Assessment

### 4.1 Potential Blockers

#### Blocker 1: Session Cookie Not Sent from Backend
**Impact:** High
**Probability:** Medium

**Symptoms:**
- Login succeeds but session cookie is not stored
- Subsequent API calls return 401

**Root Cause:**
- Backend not setting `Set-Cookie` header correctly
- CORS configuration blocking cookies

**Mitigation:**
1. Verify backend LoginResource.java line 82:
```java
.header("Set-Cookie", "session_id=" + sessionId + "; Path=/; HttpOnly; Max-Age=28800")
```
2. Check CORS configuration allows credentials:
```java
@ApplicationScoped
public class CorsFilter implements ContainerResponseFilter {
    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        responseContext.getHeaders().add("Access-Control-Allow-Credentials", "true");
        responseContext.getHeaders().add("Access-Control-Allow-Origin", "http://localhost:3000");
    }
}
```
3. Test with curl:
```bash
curl -v -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}' \
  --cookie-jar cookies.txt
```

**Fallback Plan:**
- Use JWT tokens instead of session cookies
- Implement token-based authentication with localStorage

---

#### Blocker 2: WebSocket Connection Refused
**Impact:** High
**Probability:** Low

**Symptoms:**
- WebSocket fails to connect (status code 503 or 426)
- Browser console shows "WebSocket connection failed"

**Root Cause:**
- Backend WebSocket endpoint not enabled
- Reverse proxy (NGINX) not configured for WebSocket upgrade

**Mitigation:**
1. Verify Quarkus WebSocket dependency in pom.xml:
```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-websockets</artifactId>
</dependency>
```
2. Check WebSocket is bound correctly:
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test123==" \
  http://localhost:9003/ws/transactions
```
3. If using NGINX, add WebSocket upgrade headers:
```nginx
location /ws/ {
    proxy_pass http://backend:9003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**Fallback Plan:**
- Use HTTP polling (5-second interval) instead of WebSocket
- Implement Server-Sent Events (SSE) as alternative

---

#### Blocker 3: CORS Errors in Production
**Impact:** Medium
**Probability:** High

**Symptoms:**
- API calls fail with CORS policy errors in production
- Works in development but not in prod

**Root Cause:**
- Production frontend domain not in backend CORS whitelist
- Missing credentials in CORS configuration

**Mitigation:**
1. Update backend CORS configuration for production:
```java
// application.properties
quarkus.http.cors=true
quarkus.http.cors.origins=https://portal.aurigraph.io
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.headers=Content-Type,Authorization,X-API-Key
quarkus.http.cors.exposed-headers=Set-Cookie
quarkus.http.cors.access-control-allow-credentials=true
```
2. Verify frontend uses correct production URL:
```typescript
// .env.production
VITE_API_BASE_URL=https://api.aurigraph.io/api/v11
```

**Fallback Plan:**
- Deploy frontend and backend on same domain
- Use API Gateway to proxy requests

---

### 4.2 Mitigation Strategies

#### Strategy 1: Incremental Rollout
- Deploy authentication first (Phase 1)
- Validate authentication works before moving to Phase 2
- Deploy WebSocket features after REST API is stable

#### Strategy 2: Feature Flags
```typescript
// config/features.ts
export const FEATURE_FLAGS = {
  WEBSOCKET_ENABLED: import.meta.env.VITE_WEBSOCKET_ENABLED === 'true',
  REAL_TIME_METRICS: import.meta.env.VITE_REAL_TIME_METRICS === 'true',
}

// Usage in component
if (FEATURE_FLAGS.WEBSOCKET_ENABLED) {
  websocketService.connect(WebSocketChannel.TRANSACTIONS)
}
```

#### Strategy 3: Fallback Modes
- If WebSocket fails, fall back to HTTP polling
- If authentication fails, allow read-only mode
- If backend is down, show cached data

---

### 4.3 Fallback Plans

#### Fallback 1: HTTP Polling Instead of WebSocket
```typescript
// services/polling.ts
export class PollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  startPolling(endpoint: string, callback: (data: any) => void, interval = 5000) {
    const poll = async () => {
      try {
        const response = await fetch(endpoint, { credentials: 'include' })
        const data = await response.json()
        callback(data)
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Initial poll
    poll()

    // Set up interval
    const intervalId = setInterval(poll, interval)
    this.intervals.set(endpoint, intervalId)
  }

  stopPolling(endpoint: string) {
    const intervalId = this.intervals.get(endpoint)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(endpoint)
    }
  }
}
```

#### Fallback 2: JWT Token Authentication
```typescript
// If session cookies don't work, implement JWT
const handleLogin = async () => {
  const response = await fetch('/api/v11/auth/token', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })

  const { token } = await response.json()
  localStorage.setItem('jwt_token', token)

  // Add to all requests
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
```

---

## Phase 5: Resource Allocation

### 5.1 Team Size Recommendation

**Recommended Team:** 2-3 developers

**Role Distribution:**

#### Developer 1: Frontend Lead
**Responsibilities:**
- Phase 1: Authentication integration (8-12 hours)
- Phase 2: WebSocket service implementation (8 hours)
- Code reviews for Developer 2's work

**Skills Required:**
- React/TypeScript expertise
- Redux state management
- Authentication flows (session/JWT)

---

#### Developer 2: Frontend Developer
**Responsibilities:**
- Phase 2: React components for real-time features (8 hours)
- Phase 3: E2E test implementation (8-10 hours)
- UI/UX polishing

**Skills Required:**
- React/TypeScript
- WebSocket experience
- Playwright/E2E testing

---

#### Developer 3: Full-Stack (Optional)
**Responsibilities:**
- Backend verification and fixes
- CORS configuration troubleshooting
- CI/CD pipeline setup
- Production deployment support

**Skills Required:**
- Java/Quarkus
- WebSocket (Jakarta EE)
- DevOps/CI/CD

---

### 5.2 Skill Requirements

#### Must-Have Skills
- ✅ React 18+ with TypeScript
- ✅ Redux Toolkit state management
- ✅ REST API integration (axios/fetch)
- ✅ WebSocket client implementation
- ✅ E2E testing (Playwright)

#### Nice-to-Have Skills
- 🔵 Material-UI (MUI) component library
- 🔵 Real-time data visualization (Chart.js/D3.js)
- 🔵 WebSocket debugging tools
- 🔵 Java/Quarkus (for backend troubleshooting)

---

### 5.3 Schedule Recommendations

#### Week 1: Authentication (8-12 hours)
```
Day 1-2 (6 hours):
- Update API client for session auth
- Fix Login component endpoint
- Manual testing

Day 3-4 (6 hours):
- Add session verification on load
- Implement logout functionality
- Update Redux auth slice
- Automated testing
```

#### Week 2: Real-time Features (12-16 hours)
```
Day 1-2 (6 hours):
- Create WebSocket service
- Create useWebSocket hook
- Manual WebSocket connection testing

Day 3-4 (6 hours):
- Build LiveTransactionFeed component
- Build LiveMetricsDashboard component
- Create Redux liveDataSlice

Day 5 (4 hours):
- Integrate WebSocket with Redux
- Connection status monitoring
- Testing and debugging
```

#### Week 3: Quality Assurance (10-11 hours)
```
Day 1-2 (4 hours):
- Setup Playwright
- Write authentication tests
- Write demo management tests

Day 3-4 (4 hours):
- Write WebSocket tests
- CI/CD pipeline configuration

Day 5 (3 hours):
- Visual regression tests (optional)
- Documentation
- Final testing
```

---

### 5.4 Parallel Work Opportunities

**Can Work in Parallel:**
✅ Developer 1: Authentication integration
✅ Developer 2: E2E test framework setup

✅ Developer 1: WebSocket service implementation
✅ Developer 2: React component mockups

✅ Developer 1: Redux integration
✅ Developer 2: E2E test writing
✅ Developer 3: CI/CD pipeline setup

**Must Work Sequentially:**
❌ Authentication must complete before WebSocket (requires session)
❌ Components need WebSocket service before testing
❌ E2E tests need both frontend and backend complete

---

## Appendix A: Environment Variables

### Frontend (.env)
```bash
# Development
VITE_API_BASE_URL=http://localhost:9003/api/v11
VITE_WS_BASE_URL=ws://localhost:9003
VITE_REACT_APP_API_KEY=your-api-key-here

# Production
VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11
VITE_WS_BASE_URL=wss://dlt.aurigraph.io

# Feature flags
VITE_WEBSOCKET_ENABLED=true
VITE_REAL_TIME_METRICS=true
```

### Backend (application.properties)
```properties
# CORS configuration
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:3000,https://portal.aurigraph.io
quarkus.http.cors.methods=GET,POST,PUT,DELETE,OPTIONS
quarkus.http.cors.headers=Content-Type,Authorization,X-API-Key
quarkus.http.cors.exposed-headers=Set-Cookie
quarkus.http.cors.access-control-allow-credentials=true

# Session configuration
quarkus.session.timeout=8H
quarkus.session.cookie-name=session_id
quarkus.session.cookie-path=/
quarkus.session.cookie-http-only=true

# WebSocket configuration
quarkus.websocket.max-frame-size=10M
quarkus.websocket.idle-timeout=30M
```

---

## Appendix B: Useful Commands

### Development
```bash
# Start backend (port 9003)
cd aurigraph-v11-standalone
./mvnw quarkus:dev

# Start frontend (port 3000)
cd enterprise-portal
npm run dev

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug -- auth.spec.ts
```

### Testing WebSocket Manually
```bash
# Using websocat
websocat ws://localhost:9003/ws/transactions

# Using wscat
wscat -c ws://localhost:9003/ws/transactions

# Using curl (upgrade to WebSocket)
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test123==" \
  http://localhost:9003/ws/transactions
```

### Debugging
```bash
# View backend logs
tail -f aurigraph-v11-standalone/target/quarkus.log

# View frontend logs
tail -f enterprise-portal/logs/vite.log

# Check WebSocket connections (Linux/Mac)
netstat -an | grep 9003

# Test authentication endpoint
curl -v -X POST http://localhost:9003/api/v11/login/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

---

## Summary

This comprehensive Sprint 20 plan provides:

- ✅ **Phase 1 (Week 1):** Complete authentication integration with session management
- ✅ **Phase 2 (Week 2):** Full WebSocket implementation for 7 real-time channels
- ✅ **Phase 3 (Week 3):** E2E testing with Playwright and CI/CD integration
- ✅ **Risk Assessment:** Identified blockers with mitigation strategies
- ✅ **Resource Planning:** Team size, skills, and schedule recommendations

**Total Effort:** 30-39 hours
**Success Criteria:** All tests pass, real-time features work, production-ready code
**Deliverable:** Production-ready portal with backend integration

---

**Next Steps:**
1. Review this plan with the team
2. Assign developers to roles
3. Set up development environment (backend + frontend)
4. Begin Phase 1: Authentication Integration
5. Daily standups to track progress
6. Weekly demos to stakeholders

**Questions or Need Clarification?**
Contact the development team or refer to:
- `/aurigraph-v11-standalone/SPRINT_PLAN.md`
- `/enterprise-portal/README.md`
- JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
