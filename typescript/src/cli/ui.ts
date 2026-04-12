/**
 * Terminal UI helpers — zero dependencies, ANSI colors only.
 */

const isTTY = (): boolean => Boolean(process.stdout.isTTY);
const noColor = (): boolean =>
  process.env.NO_COLOR !== undefined || process.env.TERM === 'dumb' || !isTTY();

const wrap = (code: string, text: string): string =>
  noColor() ? text : `\x1b[${code}m${text}\x1b[0m`;

export const colors = {
  cyan: (s: string): string => wrap('36', s),
  green: (s: string): string => wrap('32', s),
  red: (s: string): string => wrap('31', s),
  yellow: (s: string): string => wrap('33', s),
  dim: (s: string): string => wrap('2', s),
  bold: (s: string): string => wrap('1', s),
};

export function step(n: number, total: number, label: string): void {
  process.stdout.write(`${colors.cyan(`[${n}/${total}]`)} ${colors.bold(label)}\n`);
}

export function info(msg: string): void {
  process.stdout.write(`${colors.cyan('ℹ')} ${msg}\n`);
}

export function success(msg: string): void {
  process.stdout.write(`${colors.green('✔')} ${msg}\n`);
}

export function error(msg: string): void {
  process.stderr.write(`${colors.red('✖')} ${msg}\n`);
}

export function warn(msg: string): void {
  process.stdout.write(`${colors.yellow('⚠')} ${msg}\n`);
}

export function banner(title: string): void {
  const line = '─'.repeat(Math.max(title.length + 4, 40));
  process.stdout.write(`\n${colors.cyan(line)}\n`);
  process.stdout.write(`${colors.cyan('  ' + colors.bold(title))}\n`);
  process.stdout.write(`${colors.cyan(line)}\n\n`);
}

export function divider(): void {
  process.stdout.write(`${colors.dim('─'.repeat(40))}\n`);
}
