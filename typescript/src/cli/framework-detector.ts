/**
 * Detects the host project's framework by inspecting manifest files.
 * Zero dependencies — uses fs only.
 */

import * as fs from 'fs';
import * as path from 'path';

export type Framework =
  | 'nextjs'
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'vite'
  | 'quarkus'
  | 'fastapi'
  | 'flask'
  | 'django'
  | 'unknown';

export interface DetectionResult {
  framework: Framework;
  language: 'typescript' | 'javascript' | 'java' | 'python' | 'unknown';
  manifestPath: string | null;
}

function readFileIfExists(p: string): string | null {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function detectNode(cwd: string): DetectionResult | null {
  const pkgPath = path.join(cwd, 'package.json');
  const raw = readFileIfExists(pkgPath);
  if (!raw) return null;

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  try {
    pkg = JSON.parse(raw);
  } catch {
    return null;
  }

  const deps: Record<string, string> = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
  };

  // Order matters: check most-specific first.
  let framework: Framework = 'unknown';
  if (deps['next']) framework = 'nextjs';
  else if (deps['@nestjs/core']) framework = 'nestjs';
  else if (deps['fastify']) framework = 'fastify';
  else if (deps['express']) framework = 'express';
  else if (deps['vite']) framework = 'vite';

  // Language: presence of typescript devDep or tsconfig.json file
  const hasTs =
    Boolean(deps['typescript']) || Boolean(readFileIfExists(path.join(cwd, 'tsconfig.json')));

  return {
    framework,
    language: hasTs ? 'typescript' : 'javascript',
    manifestPath: pkgPath,
  };
}

function detectJava(cwd: string): DetectionResult | null {
  const pomPath = path.join(cwd, 'pom.xml');
  const raw = readFileIfExists(pomPath);
  if (!raw) return null;

  // Simple substring check — avoids XML parser dep.
  const isQuarkus = /io\.quarkus|quarkus-universe-bom|quarkus-bom/.test(raw);

  return {
    framework: isQuarkus ? 'quarkus' : 'unknown',
    language: 'java',
    manifestPath: pomPath,
  };
}

function detectPython(cwd: string): DetectionResult | null {
  const req = readFileIfExists(path.join(cwd, 'requirements.txt'));
  const pyproject = readFileIfExists(path.join(cwd, 'pyproject.toml'));

  if (req === null && pyproject === null) return null;

  const blob = `${req ?? ''}\n${pyproject ?? ''}`.toLowerCase();
  let framework: Framework = 'unknown';
  if (/\bfastapi\b/.test(blob)) framework = 'fastapi';
  else if (/\bdjango\b/.test(blob)) framework = 'django';
  else if (/\bflask\b/.test(blob)) framework = 'flask';

  const manifestPath = req
    ? path.join(cwd, 'requirements.txt')
    : path.join(cwd, 'pyproject.toml');

  return {
    framework,
    language: 'python',
    manifestPath,
  };
}

/**
 * Detect the framework in the given directory (defaults to process.cwd()).
 * Checks in order: Node → Java → Python.
 */
export function detectFramework(cwd: string = process.cwd()): DetectionResult {
  return (
    detectNode(cwd) ??
    detectJava(cwd) ??
    detectPython(cwd) ?? {
      framework: 'unknown',
      language: 'unknown',
      manifestPath: null,
    }
  );
}

/**
 * Map a framework to its template file (for file-writer).
 */
export function templateForFramework(framework: Framework): {
  templateName: string;
  outputFileName: string;
} {
  switch (framework) {
    case 'express':
    case 'fastify':
    case 'nestjs':
    case 'nextjs':
    case 'vite':
      return { templateName: 'express', outputFileName: 'aurigraph-integration.ts' };
    case 'quarkus':
      return { templateName: 'quarkus', outputFileName: 'AurigraphConfig.java' };
    case 'fastapi':
    case 'flask':
    case 'django':
      return { templateName: 'fastapi', outputFileName: 'aurigraph_integration.py' };
    default:
      return { templateName: 'generic', outputFileName: 'aurigraph-sdk-example.ts' };
  }
}
