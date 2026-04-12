/**
 * Tokenization wizard — prompt definitions and domain constants.
 *
 * Kept separate from {@link tokenize.ts} so that the prompt lists (use cases,
 * DMRV frameworks, jurisdictions) can be unit-tested and reused by other
 * callers (e.g. a web-based wizard) without pulling in readline.
 */

import * as readline from 'readline';
import { prompt, select } from './wizard.js';

// ---------------------------------------------------------------------------
// Use cases — 20 canonical RWAT use cases mirroring UseCaseDefinition on the
// server (aurigraph-v12/.../UseCaseRegistryService). Kept in sync manually —
// add a unit test if you add a new case on the server.
// ---------------------------------------------------------------------------

export const USE_CASES = [
  'PROVENEWS',
  'BATTUA',
  'GOLD',
  'CARBON',
  'REAL_ESTATE',
  'IP',
  'ART',
  'INFRASTRUCTURE',
  'CONTENT',
  'BATTERY_AADHAR',
  'BATTERY_PASSPORT',
  'AGCS',
  'AGRI',
  'TRADE_FINANCE',
  'WATER_RIGHTS',
  'ROYALTY_STREAMS',
  'PE_VC',
  'PRIVATE_DEBT',
  'ESG',
  'CUSTOM',
] as const;

export type UseCase = (typeof USE_CASES)[number];

export const USE_CASE_DESCRIPTIONS: Record<UseCase, string> = {
  PROVENEWS: 'content provenance + C2PA',
  BATTUA: 'stablecoin payment + carbon DMRV',
  GOLD: 'LBMA gold tokenization',
  CARBON: 'VCM/EU-ETS carbon credits',
  REAL_ESTATE: 'AIFMD real estate tokenization',
  IP: 'WIPO intellectual property',
  ART: 'MiCA/UNESCO art tokenization',
  INFRASTRUCTURE: 'AIFMD/ISO-37001 infra',
  CONTENT: 'C2PA/EU-AI-Act content',
  BATTERY_AADHAR: 'NITI Aayog battery swapping',
  BATTERY_PASSPORT: 'EU Battery Regulation',
  AGCS: 'agricultural grid compliance',
  AGRI: 'agri commodities',
  TRADE_FINANCE: 'trade finance / LC',
  WATER_RIGHTS: 'water rights allocation',
  ROYALTY_STREAMS: 'royalty streams',
  PE_VC: 'private equity / venture capital',
  PRIVATE_DEBT: 'private debt',
  ESG: 'EU Taxonomy / SFDR',
  CUSTOM: 'user-defined compliance framework',
};

// ---------------------------------------------------------------------------
// Token types
// ---------------------------------------------------------------------------

export const TOKEN_TYPES = ['PRIMARY', 'SECONDARY', 'COMPOSITE'] as const;
export type TokenType = (typeof TOKEN_TYPES)[number];

export const TOKEN_TYPE_DESCRIPTIONS: Record<TokenType, string> = {
  PRIMARY:
    'Single asset, single token. Simple tokenization (e.g., one real estate property → one token).',
  SECONDARY:
    'Derived from a PRIMARY token. Yield-bearing, fractional, or debt-backed (e.g., fractional shares of a gold bar primary).',
  COMPOSITE:
    'Bundle of multiple assets into a single token (e.g., article + photographer device + editor signature → one content token).',
};

// ---------------------------------------------------------------------------
// DMRV frameworks — keyed by use case. User can override.
// ---------------------------------------------------------------------------

export const DMRV_FRAMEWORKS_BY_USE_CASE: Record<UseCase, readonly string[]> = {
  PROVENEWS: ['C2PA', 'EU_AI_ACT'],
  BATTUA: ['GHG_PROTOCOL', 'EU_TAXONOMY', 'SFDR'],
  GOLD: ['LBMA', 'MICA'],
  CARBON: ['VCM', 'EU_ETS', 'GHG_PROTOCOL', 'ISO_14064'],
  REAL_ESTATE: ['AIFMD', 'MIFID_II', 'LADM'],
  IP: ['WIPO', 'MAS_DPT'],
  ART: ['MICA', 'UNESCO'],
  INFRASTRUCTURE: ['AIFMD', 'ISO_37001'],
  CONTENT: ['C2PA', 'EU_AI_ACT'],
  BATTERY_AADHAR: ['AIS_156', 'BIS', 'FAME_II', 'MOP_BSP_2022'],
  BATTERY_PASSPORT: ['EU_BATTERY_REG', 'CBAM'],
  AGCS: ['SADC', 'GHG_PROTOCOL', 'ISO_14064'],
  AGRI: ['GHG_PROTOCOL', 'ISO_14064'],
  TRADE_FINANCE: ['UBL_2_1', 'MIFID_II'],
  WATER_RIGHTS: ['ISO_14046'],
  ROYALTY_STREAMS: ['WIPO', 'MIFID_II'],
  PE_VC: ['AIFMD', 'MIFID_II'],
  PRIVATE_DEBT: ['AIFMD', 'MIFID_II'],
  ESG: ['EU_TAXONOMY', 'SFDR', 'GBS'],
  CUSTOM: ['CUSTOM'],
};

export function defaultFrameworkFor(useCase: UseCase): string {
  return DMRV_FRAMEWORKS_BY_USE_CASE[useCase][0];
}

// ---------------------------------------------------------------------------
// Jurisdictions
// ---------------------------------------------------------------------------

export const JURISDICTIONS = [
  'IN',
  'EU',
  'US',
  'UAE',
  'SG',
  'ZA',
  'IN_EU',
  'GLOBAL',
] as const;

export type Jurisdiction = (typeof JURISDICTIONS)[number];

export const JURISDICTION_DESCRIPTIONS: Record<Jurisdiction, string> = {
  IN: 'India — BIS, PMLA, GST, FEMA',
  EU: 'European Union — MiCA, AMLD6, GDPR, SFDR, CBAM, EU-AI-Act',
  US: 'United States — SEC, FinCEN, BSA',
  UAE: 'United Arab Emirates — CBUAE, DMCC',
  SG: 'Singapore — MAS DPT',
  ZA: 'South Africa — FICA, SARB',
  IN_EU: 'India–EU cross-border',
  GLOBAL: 'Multi-jurisdiction',
};

// ---------------------------------------------------------------------------
// Asset field model
// ---------------------------------------------------------------------------

export interface AssetField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'Date' | 'unknown';
}

const VALID_TYPES: AssetField['type'][] = ['string', 'number', 'boolean', 'Date', 'unknown'];

/**
 * Parse "name:type" lines into {@link AssetField} objects. Unknown types
 * fall back to `unknown`.
 */
export function parseAssetFields(raw: string): AssetField[] {
  const out: AssetField[] = [];
  for (const line of raw.split(/\r?\n|,/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [nameRaw, typeRaw] = trimmed.split(':').map((s) => s.trim());
    if (!nameRaw) continue;
    const typeCandidate = (typeRaw ?? 'string') as AssetField['type'];
    const type = VALID_TYPES.includes(typeCandidate) ? typeCandidate : 'unknown';
    out.push({ name: nameRaw, type });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

export interface LifecycleHooks {
  onRegister: string;
  onMonitoring: string;
  onVerification: string;
  onMint: string;
  onAssemble?: string;
}

// ---------------------------------------------------------------------------
// Prompt helpers that wrap wizard.ts primitives
// ---------------------------------------------------------------------------

export async function promptUseCase(
  rl: readline.Interface | null,
  defaultValue: UseCase,
): Promise<UseCase> {
  if (!rl) return defaultValue;
  process.stdout.write('Use case catalog:\n');
  USE_CASES.forEach((uc, i) => {
    process.stdout.write(`  ${String(i + 1).padStart(2)}) ${uc.padEnd(18)} ${USE_CASE_DESCRIPTIONS[uc]}\n`);
  });
  return select<UseCase>(rl, 'Choose use case', USE_CASES, defaultValue);
}

export async function promptTokenType(
  rl: readline.Interface | null,
  defaultValue: TokenType,
): Promise<TokenType> {
  if (!rl) return defaultValue;
  TOKEN_TYPES.forEach((tt) => {
    process.stdout.write(`  • ${tt}: ${TOKEN_TYPE_DESCRIPTIONS[tt]}\n`);
  });
  return select<TokenType>(rl, 'Choose token type', TOKEN_TYPES, defaultValue);
}

export async function promptFramework(
  rl: readline.Interface | null,
  useCase: UseCase,
  override?: string,
): Promise<string> {
  const frameworks = DMRV_FRAMEWORKS_BY_USE_CASE[useCase];
  const def = override && frameworks.includes(override) ? override : frameworks[0];
  if (!rl || frameworks.length === 1) return def;
  return select<string>(rl, `Choose DMRV framework for ${useCase}`, frameworks, def);
}

export async function promptJurisdiction(
  rl: readline.Interface | null,
  defaultValue: Jurisdiction,
): Promise<Jurisdiction> {
  if (!rl) return defaultValue;
  JURISDICTIONS.forEach((j) => {
    process.stdout.write(`  • ${j.padEnd(8)} ${JURISDICTION_DESCRIPTIONS[j]}\n`);
  });
  return select<Jurisdiction>(rl, 'Choose jurisdiction', JURISDICTIONS, defaultValue);
}

export async function promptAssetFields(
  rl: readline.Interface | null,
  defaultRaw: string,
): Promise<AssetField[]> {
  if (!rl) return parseAssetFields(defaultRaw);
  process.stdout.write(
    'Enter your asset model fields. Format: `name:type` per line, comma-separated also OK.\n' +
      '  Supported types: string | number | boolean | Date\n' +
      '  Example: assetId:string,ownerId:string,valuation:number,createdAt:Date\n',
  );
  const answer = await prompt(rl, 'Fields', defaultRaw);
  const parsed = parseAssetFields(answer);
  return parsed.length > 0 ? parsed : parseAssetFields(defaultRaw);
}

export async function promptLifecycleHooks(
  rl: readline.Interface | null,
  tokenType: TokenType,
  defaults: Partial<LifecycleHooks> = {},
): Promise<LifecycleHooks> {
  const hooks: LifecycleHooks = {
    onRegister: await prompt(
      rl,
      'When does your app CREATE/REGISTER a new asset?',
      defaults.onRegister ?? 'on asset creation',
    ),
    onMonitoring: await prompt(
      rl,
      'When do MONITORING events occur?',
      defaults.onMonitoring ?? 'on sensor / user activity',
    ),
    onVerification: await prompt(
      rl,
      'When does VERIFICATION happen?',
      defaults.onVerification ?? 'on third-party attestation',
    ),
    onMint: await prompt(
      rl,
      'When do you want to MINT/ISSUE the token?',
      defaults.onMint ?? 'after verification completes',
    ),
  };
  if (tokenType === 'COMPOSITE') {
    hooks.onAssemble = await prompt(
      rl,
      'When do you ASSEMBLE the composite bundle?',
      defaults.onAssemble ?? 'when all components are collected',
    );
  }
  return hooks;
}
