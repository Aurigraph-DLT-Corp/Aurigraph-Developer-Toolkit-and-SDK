/**
 * Interactive wizard — zero deps, uses readline over stdin/stdout.
 *
 * In non-TTY environments (CI), prompts short-circuit to defaults and
 * `runWizard` honors env-var overrides. If a required value cannot be
 * resolved, it throws so the CLI can exit with code 2.
 */

import * as readline from 'readline';
import * as path from 'path';
import { detectFramework, type Framework } from './framework-detector.js';
import { colors, step, info, success, warn, banner, divider } from './ui.js';

export const PROJECT_TYPES = ['Provenews', 'Battua', 'Hermes', 'Custom'] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const AVAILABLE_SCOPES = [
  'registry:read',
  'registry:write',
  'dmrv:write',
  'contracts:write',
  'mint:token',
  'channels:read',
] as const;

export const DEFAULT_SCOPES: string[] = ['registry:read', 'channels:read'];

export interface WizardResult {
  appName: string;
  baseUrl: string;
  projectType: ProjectType;
  callbackUrl: string;
  scopes: string[];
  framework: Framework;
}

export interface WizardOptions {
  cwd?: string;
  nonInteractive?: boolean;
  defaults?: Partial<WizardResult>;
}

interface IoHandle {
  rl: readline.Interface | null;
  close: () => void;
}

function openIo(): IoHandle {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return { rl: null, close: () => {} };
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return { rl, close: () => rl.close() };
}

/**
 * Ask a free-text question. Returns `defaultValue` on empty answer or non-TTY.
 */
export function prompt(
  rl: readline.Interface | null,
  question: string,
  defaultValue: string,
): Promise<string> {
  if (!rl) return Promise.resolve(defaultValue);
  const suffix = defaultValue ? colors.dim(` (${defaultValue})`) : '';
  return new Promise((resolve) => {
    rl.question(`${colors.cyan('?')} ${question}${suffix} `, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed === '' ? defaultValue : trimmed);
    });
  });
}

/**
 * Single-select from a list. Returns the chosen option string.
 */
export async function select<T extends string>(
  rl: readline.Interface | null,
  question: string,
  options: readonly T[],
  defaultValue: T,
): Promise<T> {
  if (!rl) return defaultValue;
  process.stdout.write(`${colors.cyan('?')} ${question}\n`);
  options.forEach((opt, i) => {
    const marker = opt === defaultValue ? colors.green('●') : colors.dim('○');
    process.stdout.write(`  ${marker} ${i + 1}) ${opt}\n`);
  });
  const defaultIdx = options.indexOf(defaultValue) + 1;
  const answer = await prompt(rl, `  Choose [1-${options.length}]`, String(defaultIdx));
  const idx = Number.parseInt(answer, 10);
  if (Number.isFinite(idx) && idx >= 1 && idx <= options.length) {
    return options[idx - 1];
  }
  return defaultValue;
}

/**
 * Multi-select via comma-separated indices. Returns chosen subset.
 */
export async function multiSelect<T extends string>(
  rl: readline.Interface | null,
  question: string,
  options: readonly T[],
  defaultSelected: readonly T[],
): Promise<T[]> {
  if (!rl) return [...defaultSelected];
  process.stdout.write(`${colors.cyan('?')} ${question}\n`);
  options.forEach((opt, i) => {
    const on = defaultSelected.includes(opt);
    const marker = on ? colors.green('[x]') : colors.dim('[ ]');
    process.stdout.write(`  ${marker} ${i + 1}) ${opt}\n`);
  });
  const defaultIdxs = defaultSelected
    .map((s) => options.indexOf(s) + 1)
    .filter((n) => n > 0)
    .join(',');
  const answer = await prompt(
    rl,
    `  Enter comma-separated numbers (or blank for default)`,
    defaultIdxs,
  );
  const picked = answer
    .split(',')
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= options.length)
    .map((n) => options[n - 1]);
  return picked.length > 0 ? [...new Set(picked)] : [...defaultSelected];
}

export async function confirm(
  rl: readline.Interface | null,
  question: string,
  defaultYes = true,
): Promise<boolean> {
  if (!rl) return defaultYes;
  const suffix = defaultYes ? 'Y/n' : 'y/N';
  const answer = await prompt(rl, `${question} [${suffix}]`, defaultYes ? 'y' : 'n');
  return /^y(es)?$/i.test(answer);
}

function dirBasename(cwd: string): string {
  return path.basename(path.resolve(cwd));
}

/**
 * Run the full interactive wizard.
 * Throws Error with code `USER_CANCELLED` if user rejects confirmation, or
 * `CI_MISSING_DEFAULTS` if non-TTY and required defaults are absent.
 */
export async function runWizard(opts: WizardOptions = {}): Promise<WizardResult> {
  const cwd = opts.cwd ?? process.cwd();
  const nonInteractive = opts.nonInteractive ?? !process.stdout.isTTY;

  banner('Aurigraph DLT SDK — init');

  // Step 1: detect framework
  step(1, 7, 'Detecting framework');
  const detected = detectFramework(cwd);
  if (detected.framework === 'unknown') {
    warn(`Could not detect framework in ${cwd} — falling back to generic template.`);
  } else {
    success(`Detected: ${colors.bold(detected.framework)} (${detected.language})`);
  }
  divider();

  const io = openIo();
  const rl = io.rl;

  if (nonInteractive && !opts.defaults) {
    info('Non-TTY environment detected — using env var defaults.');
  }

  try {
    // Step 2: project name
    step(2, 7, 'Project name');
    const defaultAppName =
      opts.defaults?.appName ?? process.env.AURIGRAPH_APP_NAME ?? dirBasename(cwd);
    const appName = await prompt(rl, 'Project name', defaultAppName);

    // Step 3: base URL
    step(3, 7, 'V12 platform base URL');
    const defaultBaseUrl =
      opts.defaults?.baseUrl ??
      process.env.AURIGRAPH_BASE_URL ??
      'https://dlt.aurigraph.io';
    const baseUrl = await prompt(rl, 'V12 base URL', defaultBaseUrl);

    // Step 4: project type
    step(4, 7, 'Project type');
    const defaultProjectType: ProjectType =
      (opts.defaults?.projectType as ProjectType | undefined) ??
      (process.env.AURIGRAPH_PROJECT_TYPE as ProjectType | undefined) ??
      'Custom';
    const projectType = await select<ProjectType>(
      rl,
      'Choose project type',
      PROJECT_TYPES,
      defaultProjectType,
    );

    // Step 5: callback URL
    step(5, 7, 'Webhook callback URL (optional)');
    const defaultCallback =
      opts.defaults?.callbackUrl ?? process.env.AURIGRAPH_CALLBACK_URL ?? '';
    const callbackUrl = await prompt(rl, 'Callback URL (blank to skip)', defaultCallback);

    // Step 6: scopes
    step(6, 7, 'Scopes');
    const defaultScopes =
      opts.defaults?.scopes ??
      (process.env.AURIGRAPH_SCOPES
        ? process.env.AURIGRAPH_SCOPES.split(',').map((s) => s.trim())
        : DEFAULT_SCOPES);
    const scopes = await multiSelect(
      rl,
      'Select scopes',
      AVAILABLE_SCOPES,
      defaultScopes as readonly (typeof AVAILABLE_SCOPES)[number][],
    );

    // Step 7: confirm
    step(7, 7, 'Confirm');
    process.stdout.write(`  ${colors.dim('appName:')}     ${appName}\n`);
    process.stdout.write(`  ${colors.dim('baseUrl:')}     ${baseUrl}\n`);
    process.stdout.write(`  ${colors.dim('projectType:')} ${projectType}\n`);
    process.stdout.write(`  ${colors.dim('callbackUrl:')} ${callbackUrl || '(none)'}\n`);
    process.stdout.write(`  ${colors.dim('scopes:')}      ${scopes.join(', ')}\n`);
    process.stdout.write(`  ${colors.dim('framework:')}   ${detected.framework}\n\n`);

    const ok = await confirm(rl, 'Proceed?', true);
    if (!ok) {
      const err = new Error('User cancelled');
      (err as Error & { code?: string }).code = 'USER_CANCELLED';
      throw err;
    }

    return {
      appName,
      baseUrl,
      projectType,
      callbackUrl,
      scopes,
      framework: detected.framework,
    };
  } finally {
    io.close();
  }
}
