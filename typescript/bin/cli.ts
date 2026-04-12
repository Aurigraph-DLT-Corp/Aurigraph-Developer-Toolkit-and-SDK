#!/usr/bin/env node
/**
 * @aurigraph/dlt-sdk CLI — entry point.
 *
 * Usage:
 *   npx @aurigraph/dlt-sdk init [--dry-run] [--yes] [--cwd <dir>]
 *   npx @aurigraph/dlt-sdk --help
 *   npx @aurigraph/dlt-sdk --version
 *
 * Exit codes:
 *   0 — success
 *   1 — error
 *   2 — user cancelled
 */

import * as readline from 'readline';
import { runWizard } from '../src/cli/wizard.js';
import { performHandshake } from '../src/cli/handshake.js';
import { writeGeneratedFiles } from '../src/cli/file-writer.js';
import { runTokenizeCli } from '../src/cli/tokenize-run.js';
import { banner, success, error, info, warn, divider, colors } from '../src/cli/ui.js';

const VERSION = '1.0.0';

function printHelp(): void {
  process.stdout.write(`
${colors.bold('@aurigraph/dlt-sdk')} — Aurigraph DLT one-click installer

${colors.bold('Usage:')}
  npx @aurigraph/dlt-sdk <command> [options]

${colors.bold('Commands:')}
  init                Interactive wizard to set up the SDK in the current project
  tokenize            Configure tokenization/minting/issuance lifecycle (run AFTER init)

${colors.bold('Options:')}
  --dry-run           Run the wizard but do not write files or call the server
  --yes, -y           Overwrite existing files without prompting
  --cwd <dir>         Target directory (default: current working directory)
  --help, -h          Show this help message
  --version, -v       Show SDK version

${colors.bold('Exit codes:')}
  0 = success · 1 = error · 2 = user cancelled
`);
}

interface Args {
  command: string | null;
  dryRun: boolean;
  yes: boolean;
  cwd: string;
  help: boolean;
  version: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    command: null,
    dryRun: false,
    yes: false,
    cwd: process.cwd(),
    help: false,
    version: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--version':
      case '-v':
        args.version = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--yes':
      case '-y':
        args.yes = true;
        break;
      case '--cwd':
        args.cwd = argv[++i] ?? process.cwd();
        break;
      default:
        if (!args.command && !a.startsWith('-')) {
          args.command = a;
        }
    }
  }
  return args;
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

async function runInit(args: Args): Promise<number> {
  try {
    const wizard = await runWizard({ cwd: args.cwd });

    divider();
    info('Calling Aurigraph handshake endpoint...');
    const handshake = await performHandshake(
      wizard.baseUrl,
      {
        appName: wizard.appName,
        projectType: wizard.projectType,
        scopes: wizard.scopes,
        callbackUrl: wizard.callbackUrl,
      },
      { dryRun: args.dryRun },
    );

    if (handshake.source === 'server') {
      success(`Handshake OK — appId=${handshake.response.appId}`);
    } else {
      warn(
        `Handshake fallback (${handshake.message ?? 'unknown'}) — writing config with placeholder key.`,
      );
    }

    divider();
    info('Writing generated files...');
    const results = await writeGeneratedFiles(
      args.cwd,
      {
        ...wizard,
        appId: handshake.response.appId,
        apiKey: handshake.response.apiKey,
      },
      {
        dryRun: args.dryRun,
        confirmOverwrite: args.yes
          ? () => true
          : (p) => promptYesNo(`Overwrite ${p}?`),
      },
    );

    for (const r of results) {
      const tag =
        r.status === 'written'
          ? colors.green('written   ')
          : r.status === 'overwritten'
            ? colors.yellow('overwrote ')
            : colors.dim('skipped   ');
      process.stdout.write(`  ${tag} ${r.path}${r.reason ? colors.dim(` (${r.reason})`) : ''}\n`);
    }

    divider();
    if (args.dryRun) {
      info('Dry-run complete — no files were written.');
    } else {
      success('Aurigraph DLT SDK initialized.');
      info('Next steps:');
      process.stdout.write(
        `  1. Add ${colors.bold('.env.aurigraph')} to .gitignore\n` +
          `  2. Install the SDK: ${colors.bold('npm install @aurigraph/dlt-sdk')}\n` +
          `  3. Review the generated sample file and wire it into your app\n`,
      );
    }

    return 0;
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'USER_CANCELLED') {
      warn('Cancelled by user.');
      return 2;
    }
    error(`init failed: ${e.message}`);
    return 1;
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return 0;
  }
  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (args.command === 'init') {
    return runInit(args);
  }

  if (args.command === 'tokenize') {
    return runTokenizeCli({
      dryRun: args.dryRun,
      yes: args.yes,
      cwd: args.cwd,
    });
  }

  if (!args.command) {
    banner('Aurigraph DLT SDK');
    info('No command provided. Run with `init` to set up a project.');
    printHelp();
    return 0;
  }

  error(`Unknown command: ${args.command}`);
  printHelp();
  return 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    error(`fatal: ${(err as Error).message}`);
    process.exit(1);
  },
);
