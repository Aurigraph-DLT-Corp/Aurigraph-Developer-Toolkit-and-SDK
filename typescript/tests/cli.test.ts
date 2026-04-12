import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { detectFramework } from '../src/cli/framework-detector.js';
import { substitute, loadTemplate, renderTemplate } from '../src/cli/templates.js';
import { buildEnvFile, buildSdkConfigJson, writeGeneratedFiles } from '../src/cli/file-writer.js';
import { performHandshake } from '../src/cli/handshake.js';

function mkTmpDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), `aurigraph-cli-${prefix}-`));
}

describe('framework-detector', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkTmpDir('fw');
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('T1: detects Express from package.json', () => {
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({
        name: 'demo-api',
        dependencies: { express: '^4.18.0' },
        devDependencies: { typescript: '^5.0.0' },
      }),
    );
    const result = detectFramework(dir);
    expect(result.framework).toBe('express');
    expect(result.language).toBe('typescript');
    expect(result.manifestPath).toContain('package.json');
  });

  it('T2: detects Quarkus from pom.xml', () => {
    fs.writeFileSync(
      path.join(dir, 'pom.xml'),
      `<?xml version="1.0"?>
<project>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.quarkus</groupId>
        <artifactId>quarkus-bom</artifactId>
      </dependency>
    </dependencies>
  </dependencyManagement>
</project>`,
    );
    const result = detectFramework(dir);
    expect(result.framework).toBe('quarkus');
    expect(result.language).toBe('java');
  });

  it('detects Next.js and FastAPI too', () => {
    // Next.js
    const nextDir = mkTmpDir('next');
    fs.writeFileSync(
      path.join(nextDir, 'package.json'),
      JSON.stringify({ dependencies: { next: '^14.0.0', react: '^18.0.0' } }),
    );
    expect(detectFramework(nextDir).framework).toBe('nextjs');
    fs.rmSync(nextDir, { recursive: true, force: true });

    // FastAPI
    const pyDir = mkTmpDir('py');
    fs.writeFileSync(path.join(pyDir, 'requirements.txt'), 'fastapi==0.110.0\nuvicorn==0.27.0\n');
    expect(detectFramework(pyDir).framework).toBe('fastapi');
    fs.rmSync(pyDir, { recursive: true, force: true });
  });

  it('returns unknown when no manifest found', () => {
    expect(detectFramework(dir).framework).toBe('unknown');
  });
});

describe('templates', () => {
  it('T4: template substitution works for all 4 templates', () => {
    // Simple substitution behavior
    expect(substitute('Hello {{NAME}}!', { NAME: 'World' })).toBe('Hello World!');
    expect(substitute('{{A}}-{{B}}-{{A}}', { A: 'x', B: 'y' })).toBe('x-y-x');
    expect(substitute('{{MISSING}}', {})).toBe('{{MISSING}}');

    const vars = {
      GENERATED_AT: '2026-04-06T00:00:00Z',
      APP_NAME: 'my-app',
      APP_ID: 'app-123',
      BASE_URL: 'https://dlt.aurigraph.io',
      PROJECT_TYPE: 'Provenews',
    };

    // express
    const express = renderTemplate('express', vars);
    expect(express).toContain('my-app');
    expect(express).toContain('https://dlt.aurigraph.io');
    expect(express).not.toContain('{{APP_NAME}}');
    expect(express).toContain("import { AurigraphClient }");

    // quarkus
    const quarkus = renderTemplate('quarkus', vars);
    expect(quarkus).toContain('AurigraphConfig');
    expect(quarkus).toContain('@ApplicationScoped');
    expect(quarkus).toContain('app-123');
    expect(quarkus).not.toContain('{{BASE_URL}}');

    // fastapi
    const fastapi = renderTemplate('fastapi', vars);
    expect(fastapi).toContain('import httpx');
    expect(fastapi).toContain('Provenews');
    expect(fastapi).not.toContain('{{APP_NAME}}');

    // generic
    const generic = renderTemplate('generic', vars);
    expect(generic).toContain('AurigraphClient');
    expect(generic).toContain('my-app');
    expect(generic).not.toContain('{{APP_NAME}}');

    // env template loads
    const envRaw = loadTemplate('env');
    expect(envRaw).toContain('AURIGRAPH_BASE_URL');
  });
});

describe('file-writer', () => {
  it('T3: env file writer produces correct format', () => {
    const now = new Date('2026-04-06T12:00:00Z');
    const env = buildEnvFile(
      {
        appName: 'demo',
        baseUrl: 'https://dlt.aurigraph.io',
        projectType: 'Battua',
        callbackUrl: 'https://demo.example.com/webhook',
        scopes: ['registry:read', 'channels:read'],
        appId: 'app-abc',
        apiKey: 'key-xyz',
        framework: 'express',
      },
      now,
    );

    expect(env).toContain('AURIGRAPH_BASE_URL=https://dlt.aurigraph.io');
    expect(env).toContain('AURIGRAPH_APP_ID=app-abc');
    expect(env).toContain('AURIGRAPH_API_KEY=key-xyz');
    expect(env).toContain('AURIGRAPH_PROJECT_TYPE=Battua');
    expect(env).toContain('AURIGRAPH_CALLBACK_URL=https://demo.example.com/webhook');
    expect(env).toContain('AURIGRAPH_SCOPES=registry:read,channels:read');
    expect(env).toContain('2026-04-06T12:00:00');
    // Must not commit — header comment present
    expect(env).toContain('DO NOT commit');
  });

  it('builds non-secret sdk config json', () => {
    const json = buildSdkConfigJson({
      appName: 'demo',
      baseUrl: 'https://dlt.aurigraph.io',
      projectType: 'Provenews',
      callbackUrl: '',
      scopes: ['registry:read'],
      appId: 'app-1',
      apiKey: 'SECRET_SHOULD_NOT_APPEAR',
      framework: 'express',
    });
    const parsed = JSON.parse(json);
    expect(parsed.appName).toBe('demo');
    expect(parsed.appId).toBe('app-1');
    expect(parsed.apiKey).toBeUndefined();
    expect(json).not.toContain('SECRET_SHOULD_NOT_APPEAR');
  });

  it('writes three files and is idempotent (does not overwrite without confirmation)', async () => {
    const dir = mkTmpDir('write');
    try {
      const cfg = {
        appName: 'demo',
        baseUrl: 'https://dlt.aurigraph.io',
        projectType: 'Custom',
        callbackUrl: '',
        scopes: ['registry:read'],
        appId: 'app-1',
        apiKey: 'k-1',
        framework: 'express' as const,
      };
      const first = await writeGeneratedFiles(dir, cfg);
      expect(first.every((r) => r.status === 'written')).toBe(true);
      expect(fs.existsSync(path.join(dir, '.env.aurigraph'))).toBe(true);

      // Second run — default confirmOverwrite is false → all skipped
      const second = await writeGeneratedFiles(dir, cfg);
      expect(second.every((r) => r.status === 'skipped')).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('handshake', () => {
  it('falls back gracefully when endpoint returns 404', async () => {
    const mockFetch = (async () =>
      ({
        ok: false,
        status: 404,
        json: async () => ({}),
      }) as Response) as unknown as typeof fetch;

    const result = await performHandshake(
      'https://dlt.aurigraph.io',
      { appName: 'demo', projectType: 'Custom', scopes: [], callbackUrl: '' },
      { fetchImpl: mockFetch },
    );
    expect(result.source).toBe('fallback');
    expect(result.response.apiKey).toBe('PLACEHOLDER_KEY_REPLACE_ME');
    expect(result.response.appId).toContain('local-demo-');
  });

  it('returns server response on success', async () => {
    const mockFetch = (async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({
          appId: 'app-real',
          apiKey: 'key-real',
          sdkConfig: { baseUrl: 'https://dlt.aurigraph.io', version: 'v11' },
        }),
      }) as Response) as unknown as typeof fetch;

    const result = await performHandshake(
      'https://dlt.aurigraph.io',
      { appName: 'demo', projectType: 'Provenews', scopes: ['registry:read'], callbackUrl: '' },
      { fetchImpl: mockFetch },
    );
    expect(result.source).toBe('server');
    expect(result.response.appId).toBe('app-real');
    expect(result.response.apiKey).toBe('key-real');
  });

  it('dry-run skips the network call', async () => {
    const result = await performHandshake(
      'https://dlt.aurigraph.io',
      { appName: 'demo', projectType: 'Custom', scopes: [], callbackUrl: '' },
      { dryRun: true },
    );
    expect(result.source).toBe('fallback');
    expect(result.message).toContain('dry-run');
  });
});
