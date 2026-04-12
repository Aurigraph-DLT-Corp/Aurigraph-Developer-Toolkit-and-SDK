/**
 * Tokenization wizard orchestration.
 *
 * 10-step flow (see {@link runTokenizeWizard}):
 *   1.  Load .env.aurigraph from {@link init} wizard
 *   2.  Handshake verification via client.sdk.hello()
 *   3.  Use-case selection
 *   4.  Token type (PRIMARY | SECONDARY | COMPOSITE)
 *   5.  DMRV framework
 *   6.  Jurisdiction
 *   7.  Asset metadata schema
 *   8.  Lifecycle hook mapping (when-does-X-happen-in-your-app)
 *   9.  Code generation (4 files)
 *   10. Summary + next steps
 *
 * This module exports pure functions so {@link tokenize-run.ts} can wire it
 * into the CLI bin, and unit tests (follow-up AAT) can drive individual
 * steps. Uses only readline + fs — no new dependencies.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { banner, colors, divider, info, step, success, warn } from './ui.js';
import { confirm, prompt } from './wizard.js';
import {
  type AssetField,
  type Jurisdiction,
  type LifecycleHooks,
  type TokenType,
  type UseCase,
  JURISDICTIONS,
  TOKEN_TYPES,
  USE_CASES,
  defaultFrameworkFor,
  parseAssetFields,
  promptAssetFields,
  promptFramework,
  promptJurisdiction,
  promptLifecycleHooks,
  promptTokenType,
  promptUseCase,
} from './tokenize-prompts.js';
import { renderConfig } from './tokenize-templates/config.template.js';
import { renderService } from './tokenize-templates/service.template.js';
import { renderExample } from './tokenize-templates/example.template.js';
import { renderIntegration } from './tokenize-templates/integration.template.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EnvConfig {
  appId: string;
  apiKey: string;
  baseUrl: string;
}

export interface HandshakeSummary {
  appName: string;
  approvedScopes: string[];
  pendingScopes: string[];
  source: 'server' | 'fallback';
  message?: string;
}

export interface TokenizeWizardResult {
  env: EnvConfig;
  handshake: HandshakeSummary;
  useCase: UseCase;
  tokenType: TokenType;
  dmrvFramework: string;
  jurisdiction: Jurisdiction;
  fields: AssetField[];
  hooks: LifecycleHooks;
}

export interface TokenizeWizardOptions {
  cwd?: string;
  yes?: boolean;
  dryRun?: boolean;
  nonInteractive?: boolean;
}

// ---------------------------------------------------------------------------
// Step 1 — load .env.aurigraph
// ---------------------------------------------------------------------------

export function loadEnvAurigraph(cwd: string): EnvConfig | null {
  const envPath = path.join(cwd, '.env.aurigraph');
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, 'utf8');
  const out: Record<string, string> = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  const appId = out.AURIGRAPH_APP_ID ?? process.env.AURIGRAPH_APP_ID ?? '';
  const apiKey = out.AURIGRAPH_API_KEY ?? process.env.AURIGRAPH_API_KEY ?? '';
  const baseUrl =
    out.AURIGRAPH_BASE_URL ??
    process.env.AURIGRAPH_BASE_URL ??
    'https://dlt.aurigraph.io';
  if (!appId || !apiKey) return null;
  return { appId, apiKey, baseUrl };
}

// ---------------------------------------------------------------------------
// Step 2 — handshake (lightweight fetch, no client dep)
// ---------------------------------------------------------------------------

export async function verifyHandshake(env: EnvConfig): Promise<HandshakeSummary> {
  const fallback: HandshakeSummary = {
    appName: '(offline)',
    approvedScopes: [],
    pendingScopes: [],
    source: 'fallback',
    message: 'handshake skipped',
  };

  const g = globalThis as unknown as {
    fetch?: (url: string, init?: unknown) => Promise<{
      ok: boolean;
      status: number;
      json: () => Promise<unknown>;
      text: () => Promise<string>;
    }>;
  };
  if (typeof g.fetch !== 'function') {
    return { ...fallback, message: 'fetch not available' };
  }

  try {
    const url = `${env.baseUrl.replace(/\/$/, '')}/api/v11/sdk/handshake/hello`;
    const res = await g.fetch(url, {
      method: 'GET',
      headers: {
        'X-Aurigraph-App-Id': env.appId,
        'X-Aurigraph-Api-Key': env.apiKey,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      return { ...fallback, message: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as {
      appName?: string;
      approvedScopes?: string[];
      pendingScopes?: string[];
    };
    return {
      appName: body.appName ?? '(unknown)',
      approvedScopes: Array.isArray(body.approvedScopes) ? body.approvedScopes : [],
      pendingScopes: Array.isArray(body.pendingScopes) ? body.pendingScopes : [],
      source: 'server',
    };
  } catch (err) {
    return { ...fallback, message: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Non-TTY env var fallbacks
// ---------------------------------------------------------------------------

function envUseCase(): UseCase {
  const v = process.env.AURIGRAPH_WIZARD_USE_CASE as UseCase | undefined;
  return v && USE_CASES.includes(v) ? v : 'PROVENEWS';
}
function envTokenType(): TokenType {
  const v = process.env.AURIGRAPH_WIZARD_TOKEN_TYPE as TokenType | undefined;
  return v && TOKEN_TYPES.includes(v) ? v : 'COMPOSITE';
}
function envJurisdiction(): Jurisdiction {
  const v = process.env.AURIGRAPH_WIZARD_JURISDICTION as Jurisdiction | undefined;
  return v && JURISDICTIONS.includes(v) ? v : 'GLOBAL';
}
function envFramework(useCase: UseCase): string {
  return process.env.AURIGRAPH_WIZARD_FRAMEWORK ?? defaultFrameworkFor(useCase);
}
function envFields(): string {
  return (
    process.env.AURIGRAPH_WIZARD_FIELDS ??
    'assetId:string,ownerId:string,contentHash:string,createdAt:Date'
  );
}

// ---------------------------------------------------------------------------
// File writing
// ---------------------------------------------------------------------------

export interface GeneratedFile {
  path: string;
  status: 'written' | 'skipped' | 'overwritten';
  reason?: string;
}

async function writeFileIdempotent(
  fullPath: string,
  contents: string,
  shouldOverwrite: (p: string) => Promise<boolean> | boolean,
): Promise<GeneratedFile> {
  if (fs.existsSync(fullPath)) {
    const ok = await Promise.resolve(shouldOverwrite(fullPath));
    if (!ok) return { path: fullPath, status: 'skipped', reason: 'file exists' };
    fs.writeFileSync(fullPath, contents, 'utf8');
    return { path: fullPath, status: 'overwritten' };
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, contents, 'utf8');
  return { path: fullPath, status: 'written' };
}

export async function writeGeneratedTokenizationFiles(
  cwd: string,
  result: TokenizeWizardResult,
  opts: {
    dryRun?: boolean;
    confirmOverwrite?: (p: string) => Promise<boolean> | boolean;
    now?: Date;
  } = {},
): Promise<GeneratedFile[]> {
  const now = (opts.now ?? new Date()).toISOString();
  const confirmFn = opts.confirmOverwrite ?? (() => false);

  const files: Array<{ name: string; contents: string }> = [
    {
      name: 'aurigraph-tokenization.config.ts',
      contents: renderConfig({
        useCase: result.useCase,
        tokenType: result.tokenType,
        dmrvFramework: result.dmrvFramework,
        jurisdiction: result.jurisdiction,
        fields: result.fields,
        generatedAt: now,
      }),
    },
    {
      name: 'aurigraph-tokenization.service.ts',
      contents: renderService({
        useCase: result.useCase,
        tokenType: result.tokenType,
        dmrvFramework: result.dmrvFramework,
        jurisdiction: result.jurisdiction,
        hooks: result.hooks,
        fields: result.fields,
        generatedAt: now,
      }),
    },
    {
      name: 'aurigraph-tokenization.example.ts',
      contents: renderExample({
        useCase: result.useCase,
        tokenType: result.tokenType,
        generatedAt: now,
      }),
    },
    {
      name: 'TOKENIZATION_INTEGRATION.md',
      contents: renderIntegration({
        useCase: result.useCase,
        tokenType: result.tokenType,
        dmrvFramework: result.dmrvFramework,
        jurisdiction: result.jurisdiction,
        hooks: result.hooks,
        approvedScopes: result.handshake.approvedScopes,
        pendingScopes: result.handshake.pendingScopes,
        generatedAt: now,
      }),
    },
  ];

  if (opts.dryRun) {
    return files.map((f) => ({
      path: path.join(cwd, f.name),
      status: 'skipped',
      reason: 'dry-run',
    }));
  }

  fs.mkdirSync(cwd, { recursive: true });
  const results: GeneratedFile[] = [];
  for (const f of files) {
    results.push(await writeFileIdempotent(path.join(cwd, f.name), f.contents, confirmFn));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Main wizard orchestration
// ---------------------------------------------------------------------------

interface IoHandle {
  rl: readline.Interface | null;
  close: () => void;
}

function openIo(nonInteractive: boolean): IoHandle {
  if (nonInteractive || !process.stdout.isTTY || !process.stdin.isTTY) {
    return { rl: null, close: () => {} };
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return { rl, close: () => rl.close() };
}

/**
 * Run the full 10-step tokenization wizard.
 *
 * @throws Error with `code=ENV_MISSING` if .env.aurigraph not found.
 * @throws Error with `code=USER_CANCELLED` if user rejects the final confirm.
 */
export async function runTokenizeWizard(
  opts: TokenizeWizardOptions = {},
): Promise<TokenizeWizardResult> {
  const cwd = opts.cwd ?? process.cwd();
  const nonInteractive = opts.nonInteractive ?? !process.stdout.isTTY;

  banner('Aurigraph DLT SDK — tokenize');

  // Step 1: load env
  step(1, 10, 'Loading .env.aurigraph');
  const env = loadEnvAurigraph(cwd);
  if (!env) {
    const err = new Error(
      '.env.aurigraph not found (or AURIGRAPH_APP_ID / AURIGRAPH_API_KEY missing). ' +
        'Run `npx @aurigraph/dlt-sdk init` first.',
    );
    (err as Error & { code?: string }).code = 'ENV_MISSING';
    throw err;
  }
  success(`Loaded appId=${env.appId} baseUrl=${env.baseUrl}`);
  divider();

  // Step 2: handshake
  step(2, 10, 'Handshake verification');
  info('Calling /api/v11/sdk/handshake/hello ...');
  const handshake = await verifyHandshake(env);
  if (handshake.source === 'server') {
    success(`Connected to Aurigraph DLT`);
    process.stdout.write(`  ${colors.dim('App:')}             ${handshake.appName}\n`);
    process.stdout.write(
      `  ${colors.dim('Approved scopes:')} ${handshake.approvedScopes.join(', ') || '(none)'}\n`,
    );
    process.stdout.write(
      `  ${colors.dim('Pending scopes:')}  ${handshake.pendingScopes.join(', ') || '(none)'}\n`,
    );
  } else {
    warn(
      `Handshake unavailable (${handshake.message ?? 'offline'}) — continuing with placeholder scope data. ` +
        'Generated code will work once the server is reachable and scopes are granted.',
    );
  }
  divider();

  const io = openIo(nonInteractive);
  const rl = io.rl;

  try {
    // Step 3: use case
    step(3, 10, 'Use case');
    const useCase = await promptUseCase(rl, envUseCase());

    // Step 4: token type
    step(4, 10, 'Token type');
    const tokenType = await promptTokenType(rl, envTokenType());

    // Step 5: DMRV framework
    step(5, 10, 'DMRV framework');
    const dmrvFramework = await promptFramework(rl, useCase, envFramework(useCase));

    // Step 6: jurisdiction
    step(6, 10, 'Jurisdiction');
    const jurisdiction = await promptJurisdiction(rl, envJurisdiction());

    // Step 7: asset fields
    step(7, 10, 'Asset metadata schema');
    const fields = await promptAssetFields(rl, envFields());

    // Step 8: lifecycle hooks
    step(8, 10, 'Lifecycle hook mapping');
    const hooks = await promptLifecycleHooks(rl, tokenType);

    // Step 9: confirm
    step(9, 10, 'Confirm & generate');
    process.stdout.write(`  ${colors.dim('useCase:')}        ${useCase}\n`);
    process.stdout.write(`  ${colors.dim('tokenType:')}      ${tokenType}\n`);
    process.stdout.write(`  ${colors.dim('dmrvFramework:')}  ${dmrvFramework}\n`);
    process.stdout.write(`  ${colors.dim('jurisdiction:')}   ${jurisdiction}\n`);
    process.stdout.write(`  ${colors.dim('fields:')}         ${fields.map((f) => `${f.name}:${f.type}`).join(', ')}\n\n`);

    const proceed = rl ? await confirm(rl, 'Generate files?', true) : true;
    if (!proceed) {
      const err = new Error('User cancelled');
      (err as Error & { code?: string }).code = 'USER_CANCELLED';
      throw err;
    }

    return {
      env,
      handshake,
      useCase,
      tokenType,
      dmrvFramework,
      jurisdiction,
      fields,
      hooks,
    };
  } finally {
    io.close();
  }
}

// ---------------------------------------------------------------------------
// Summary helper — called by tokenize-run after file generation
// ---------------------------------------------------------------------------

export function printSummary(
  result: TokenizeWizardResult,
  files: GeneratedFile[],
): void {
  divider();
  step(10, 10, 'Summary');
  success('Tokenization wizard complete!');

  process.stdout.write('\n  Generated files:\n');
  for (const f of files) {
    const tag =
      f.status === 'written'
        ? colors.green('written   ')
        : f.status === 'overwritten'
          ? colors.yellow('overwrote ')
          : colors.dim('skipped   ');
    process.stdout.write(
      `    ${tag} ${f.path}${f.reason ? colors.dim(` (${f.reason})`) : ''}\n`,
    );
  }

  process.stdout.write('\n  Configured for:\n');
  process.stdout.write(`    Use case:       ${result.useCase}\n`);
  process.stdout.write(`    Token type:     ${result.tokenType}\n`);
  process.stdout.write(`    DMRV framework: ${result.dmrvFramework}\n`);
  process.stdout.write(`    Jurisdiction:   ${result.jurisdiction}\n`);

  // Required scopes matrix
  const requiredForAll = new Set<string>([
    'registry:read',
    'registry:write',
    'dmrv:write',
    'mint:token',
  ]);
  if (result.tokenType === 'COMPOSITE' || result.tokenType === 'SECONDARY') {
    requiredForAll.add('contracts:write');
  }
  process.stdout.write('\n  Required scopes (status):\n');
  for (const s of requiredForAll) {
    const approved = result.handshake.approvedScopes.includes(s);
    const pending = result.handshake.pendingScopes.includes(s);
    const tag = approved
      ? colors.green('✓')
      : pending
        ? colors.yellow('⚠')
        : colors.dim('○');
    const note = approved ? 'approved' : pending ? 'pending admin approval' : 'not requested';
    process.stdout.write(`    ${tag} ${s.padEnd(20)} (${note})\n`);
  }

  process.stdout.write(
    '\n  Next steps:\n' +
      '    1. Request admin approval for pending scopes:\n' +
      '       curl -X POST ' +
      result.env.baseUrl +
      '/api/v11/sdk/scopes/request\n' +
      "    2. Import the service in your app:\n" +
      "       import { AurigraphTokenizationService } from './aurigraph-tokenization.service';\n" +
      '    3. Run the example to test end-to-end:\n' +
      '       npx tsx aurigraph-tokenization.example.ts\n' +
      '\n  Documentation: https://dlt.aurigraph.io/docs/handshake\n',
  );
}

// Re-export for test and cli-run callers
export { parseAssetFields };
// Silence unused-warning for the named prompt import which is kept to allow
// future custom prompts without re-importing.
export { prompt as _prompt };
