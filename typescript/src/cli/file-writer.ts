/**
 * Write generated files to the host project directory.
 *
 * Idempotent: existing files are never silently overwritten. Callers provide
 * a `confirmOverwrite` callback (wizard prompts the user; tests pass a stub).
 */

import * as fs from 'fs';
import * as path from 'path';
import { renderTemplate, type TemplateName } from './templates.js';
import { templateForFramework, type Framework } from './framework-detector.js';

export interface WizardConfig {
  appName: string;
  baseUrl: string;
  projectType: string;
  callbackUrl: string;
  scopes: string[];
  appId: string;
  apiKey: string;
  framework: Framework;
}

export interface FileWriteResult {
  path: string;
  status: 'written' | 'skipped' | 'overwritten';
  reason?: string;
}

export type ConfirmOverwrite = (filePath: string) => Promise<boolean> | boolean;

const alwaysOverwrite: ConfirmOverwrite = () => true;
const neverOverwrite: ConfirmOverwrite = () => false;

/**
 * Build the .env.aurigraph contents from WizardConfig.
 * Exported for testing.
 */
export function buildEnvFile(cfg: WizardConfig, now: Date = new Date()): string {
  return renderTemplate('env', {
    GENERATED_AT: now.toISOString(),
    BASE_URL: cfg.baseUrl,
    APP_ID: cfg.appId,
    API_KEY: cfg.apiKey,
    PROJECT_TYPE: cfg.projectType,
    CALLBACK_URL: cfg.callbackUrl || '',
    SCOPES: cfg.scopes.join(','),
  });
}

/**
 * Build the non-secret aurigraph-sdk.config.json contents.
 */
export function buildSdkConfigJson(cfg: WizardConfig): string {
  const nonSecret = {
    appName: cfg.appName,
    appId: cfg.appId,
    baseUrl: cfg.baseUrl,
    projectType: cfg.projectType,
    callbackUrl: cfg.callbackUrl || null,
    scopes: cfg.scopes,
    framework: cfg.framework,
    sdkVersion: '1.0.0',
    apiVersion: 'v11',
  };
  return JSON.stringify(nonSecret, null, 2) + '\n';
}

/**
 * Build the framework-specific sample integration file contents.
 */
export function buildSampleFile(
  cfg: WizardConfig,
  now: Date = new Date(),
): { fileName: string; contents: string } {
  const { templateName, outputFileName } = templateForFramework(cfg.framework);
  const contents = renderTemplate(templateName as TemplateName, {
    GENERATED_AT: now.toISOString(),
    APP_NAME: cfg.appName,
    APP_ID: cfg.appId,
    BASE_URL: cfg.baseUrl,
    PROJECT_TYPE: cfg.projectType,
  });
  return { fileName: outputFileName, contents };
}

async function writeOne(
  targetDir: string,
  fileName: string,
  contents: string,
  confirmOverwrite: ConfirmOverwrite,
): Promise<FileWriteResult> {
  const fullPath = path.join(targetDir, fileName);
  if (fs.existsSync(fullPath)) {
    const ok = await Promise.resolve(confirmOverwrite(fullPath));
    if (!ok) {
      return { path: fullPath, status: 'skipped', reason: 'file exists' };
    }
    fs.writeFileSync(fullPath, contents, 'utf8');
    return { path: fullPath, status: 'overwritten' };
  }
  fs.writeFileSync(fullPath, contents, 'utf8');
  return { path: fullPath, status: 'written' };
}

/**
 * Write all generated files. Returns an array of results for reporting.
 */
export async function writeGeneratedFiles(
  targetDir: string,
  cfg: WizardConfig,
  opts: {
    confirmOverwrite?: ConfirmOverwrite;
    dryRun?: boolean;
    now?: Date;
  } = {},
): Promise<FileWriteResult[]> {
  const confirm = opts.confirmOverwrite ?? neverOverwrite;
  const now = opts.now ?? new Date();

  const envContents = buildEnvFile(cfg, now);
  const jsonContents = buildSdkConfigJson(cfg);
  const sample = buildSampleFile(cfg, now);

  if (opts.dryRun) {
    return [
      { path: path.join(targetDir, '.env.aurigraph'), status: 'skipped', reason: 'dry-run' },
      {
        path: path.join(targetDir, 'aurigraph-sdk.config.json'),
        status: 'skipped',
        reason: 'dry-run',
      },
      { path: path.join(targetDir, sample.fileName), status: 'skipped', reason: 'dry-run' },
    ];
  }

  // Ensure target dir exists.
  fs.mkdirSync(targetDir, { recursive: true });

  const results: FileWriteResult[] = [];
  results.push(await writeOne(targetDir, '.env.aurigraph', envContents, confirm));
  results.push(await writeOne(targetDir, 'aurigraph-sdk.config.json', jsonContents, confirm));
  results.push(await writeOne(targetDir, sample.fileName, sample.contents, confirm));
  return results;
}

// Re-export helpers for test callers.
export { alwaysOverwrite, neverOverwrite };
