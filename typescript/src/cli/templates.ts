/**
 * Template loader + simple {{VAR}} substitution (no handlebars, no regex escaping
 * issues because variable names are constrained to [A-Z_]).
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export type TemplateName = 'env' | 'express' | 'quarkus' | 'fastapi' | 'generic';

const TEMPLATE_FILES: Record<TemplateName, string> = {
  env: 'env.tpl',
  express: 'express.ts.tpl',
  quarkus: 'quarkus.java.tpl',
  fastapi: 'fastapi.py.tpl',
  generic: 'generic.ts.tpl',
};

/**
 * Resolve candidate directories for template files. Templates live under
 * src/cli/templates/*.tpl and are NOT copied by tsc — the compiled code in
 * dist/src/cli/templates.js locates them by walking up to the package root.
 */
function templateCandidateDirs(): string[] {
  const hereDir = path.dirname(fileURLToPath(import.meta.url));
  return [
    // Running from src (vitest, ts-node, tsx)
    path.join(hereDir, 'templates'),
    // Running from dist/src/cli (built CJS/ESM)
    path.resolve(hereDir, '../../../src/cli/templates'),
    // Running from dist/cli (alternate layout)
    path.resolve(hereDir, '../../src/cli/templates'),
  ];
}

export function loadTemplate(name: TemplateName): string {
  const file = TEMPLATE_FILES[name];
  const tried: string[] = [];
  for (const dir of templateCandidateDirs()) {
    const fullPath = path.join(dir, file);
    tried.push(fullPath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
  }
  throw new Error(
    `Template "${name}" not found. Searched: ${tried.join(', ')}`,
  );
}

/**
 * Substitute {{KEY}} tokens. Missing keys are left as-is (caller's choice).
 * Keys must be uppercase letters/digits/underscores.
 */
export function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
  });
}

/**
 * Convenience: load + substitute.
 */
export function renderTemplate(name: TemplateName, vars: Record<string, string>): string {
  return substitute(loadTemplate(name), vars);
}
