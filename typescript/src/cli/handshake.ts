/**
 * Server handshake — POST /api/v11/sdk/install
 *
 * Zero runtime deps: uses native fetch (Node 18+).
 * Falls back gracefully if the endpoint returns 404/5xx so `init` still
 * produces a usable local config with a placeholder API key.
 */

export interface HandshakeRequest {
  appName: string;
  projectType: string;
  scopes: string[];
  callbackUrl: string;
}

export interface HandshakeResponse {
  appId: string;
  apiKey: string;
  sdkConfig: {
    baseUrl: string;
    version: string;
    [k: string]: unknown;
  };
  sampleCode?: string;
}

export interface HandshakeResult {
  response: HandshakeResponse;
  source: 'server' | 'fallback';
  message?: string;
}

const DEFAULT_TIMEOUT_MS = 5000;

function placeholderResponse(baseUrl: string, appName: string): HandshakeResponse {
  // Deterministic-ish placeholders so repeated dry runs are stable.
  const safeName = appName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return {
    appId: `local-${safeName}-${Date.now().toString(36)}`,
    apiKey: 'PLACEHOLDER_KEY_REPLACE_ME',
    sdkConfig: {
      baseUrl,
      version: 'v11',
    },
    sampleCode: undefined,
  };
}

export async function performHandshake(
  baseUrl: string,
  req: HandshakeRequest,
  opts: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    dryRun?: boolean;
  } = {},
): Promise<HandshakeResult> {
  if (opts.dryRun) {
    return {
      response: placeholderResponse(baseUrl, req.appName),
      source: 'fallback',
      message: 'dry-run: skipped server call',
    };
  }

  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    return {
      response: placeholderResponse(baseUrl, req.appName),
      source: 'fallback',
      message: 'native fetch unavailable (need Node 18+)',
    };
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/api/v11/sdk/install`;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        response: placeholderResponse(baseUrl, req.appName),
        source: 'fallback',
        message: `server returned ${res.status}`,
      };
    }

    const body = (await res.json()) as Partial<HandshakeResponse>;
    if (!body.appId || !body.apiKey) {
      return {
        response: placeholderResponse(baseUrl, req.appName),
        source: 'fallback',
        message: 'server response missing appId/apiKey',
      };
    }

    return {
      response: {
        appId: body.appId,
        apiKey: body.apiKey,
        sdkConfig: body.sdkConfig ?? { baseUrl, version: 'v11' },
        sampleCode: body.sampleCode,
      },
      source: 'server',
    };
  } catch (err) {
    return {
      response: placeholderResponse(baseUrl, req.appName),
      source: 'fallback',
      message: `network error: ${(err as Error).message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}
