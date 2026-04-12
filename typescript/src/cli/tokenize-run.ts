/**
 * Tokenization wizard — CLI entry point.
 *
 * Invoked from {@link bin/cli.ts} when the user runs:
 *   npx @aurigraph/dlt-sdk tokenize [--dry-run] [--yes] [--cwd <dir>]
 *
 * Exit codes:
 *   0 — success
 *   1 — error (env missing, handshake fatal, file I/O)
 *   2 — user cancelled
 */

import * as readline from 'readline';
import { colors, divider, error, info, warn } from './ui.js';
import {
  printSummary,
  runTokenizeWizard,
  writeGeneratedTokenizationFiles,
} from './tokenize.js';

export interface TokenizeCliArgs {
  dryRun: boolean;
  yes: boolean;
  cwd: string;
  nonInteractive?: boolean;
}

async function promptYesNo(question: string): Promise<boolean> {
  if (!process.stdout.isTTY) return false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await new Promise<boolean>((resolve) => {
      rl.question(`${colors.yellow('?')} ${question} [y/N] `, (answer) => {
        resolve(/^y(es)?$/i.test(answer.trim()));
      });
    });
  } finally {
    rl.close();
  }
}

/**
 * Run the tokenize subcommand. Returns a process exit code.
 */
export async function runTokenizeCli(args: TokenizeCliArgs): Promise<number> {
  try {
    const result = await runTokenizeWizard({
      cwd: args.cwd,
      yes: args.yes,
      dryRun: args.dryRun,
      nonInteractive: args.nonInteractive,
    });

    divider();
    info('Writing generated files...');
    const files = await writeGeneratedTokenizationFiles(args.cwd, result, {
      dryRun: args.dryRun,
      confirmOverwrite: args.yes ? () => true : (p) => promptYesNo(`Overwrite ${p}?`),
    });

    printSummary(result, files);

    if (args.dryRun) {
      divider();
      info('Dry-run complete — no files were written.');
    }
    return 0;
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'USER_CANCELLED') {
      warn('Cancelled by user.');
      return 2;
    }
    if (e.code === 'ENV_MISSING') {
      error(e.message);
      info('Run `npx @aurigraph/dlt-sdk init` first to create .env.aurigraph.');
      return 1;
    }
    error(`tokenize failed: ${e.message}`);
    return 1;
  }
}
