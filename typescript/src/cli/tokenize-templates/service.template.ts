/**
 * Template renderer — `aurigraph-tokenization.service.ts`
 *
 * The generated service is the heart of the wizard output: it wires the
 * user's app lifecycle into Aurigraph's 5-stage tokenization pipeline.
 *
 * 5 STAGES:
 *   1. REGISTER     → POST /api/v11/provenews/ledger/assets
 *   2. DMRV EVENT   → POST /api/v11/dmrv/events (via client.dmrv)
 *   3. VERIFY       → recorded as DMRV VERIFICATION event
 *   4. MINT         → POST /api/v11/registries/battua/mint (or generic)
 *   5. ASSEMBLE     → POST /api/v11/provenews/tokens/composite (COMPOSITE only)
 */

import type {
  AssetField,
  LifecycleHooks,
  TokenType,
  UseCase,
} from '../tokenize-prompts.js';

export interface ServiceTemplateInput {
  useCase: UseCase;
  tokenType: TokenType;
  dmrvFramework: string;
  jurisdiction: string;
  hooks: LifecycleHooks;
  fields: AssetField[];
  generatedAt: string;
}

function renderMetadataMapping(fields: AssetField[]): string {
  if (fields.length === 0) {
    return `        // No user fields captured — add your own mappings here.`;
  }
  return fields
    .filter((f) => f.name !== 'assetId' && f.name !== 'ownerId' && f.name !== 'contentHash')
    .map((f) => {
      const access =
        f.type === 'Date' ? `asset.${f.name}?.toISOString()` : `asset.${f.name}`;
      return `        ${f.name}: ${access},`;
    })
    .join('\n');
}

function renderMintMethod(tokenType: TokenType, useCase: UseCase, hookDesc: string): string {
  const battuaMint = `
  /**
   * STAGE 4: Mint / Issue Token
   *
   * Called when: ${hookDesc}
   *
   * Uses the Battua mint endpoint because use case = BATTUA.
   * Requires scope: mint:token (admin-gated — see TOKENIZATION_INTEGRATION.md).
   */
  async mintToken(
    assetId: string,
    amount: number,
    toAddress: string,
  ): Promise<{ tokenId: string; txHash: string }> {
    const randomHex = (n: number): string => {
      const bytes = new Uint8Array(n);
      for (let i = 0; i < n; i++) bytes[i] = Math.floor(Math.random() * 256);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    };

    const result = (await this.client.registries.battua.mint({
      txHash: '0x' + randomHex(32),
      fromAddress: '0x0',
      toAddress,
      amount: amount.toString(),
      symbol: 'BTUA',
      assetId,
    } as unknown as Parameters<typeof this.client.registries.battua.mint>[0])) as {
      tokenId?: string;
      txHash?: string;
    };
    return {
      tokenId: result.tokenId ?? assetId,
      txHash: result.txHash ?? 'pending',
    };
  }`;

  const genericMint = `
  /**
   * STAGE 4: Mint / Issue Token
   *
   * Called when: ${hookDesc}
   *
   * Uses the generic token registry for use case = ${useCase}.
   * Requires scope: mint:token (admin-gated — see TOKENIZATION_INTEGRATION.md).
   */
  async mintToken(
    assetId: string,
    amount: number,
    toAddress: string,
  ): Promise<{ tokenId: string; txHash: string }> {
    const tokens = (this.client.registries as unknown as {
      tokens?: {
        mint: (
          id: string,
          body: { toAddress: string; amount: number },
        ) => Promise<{ tokenId?: string; txHash?: string }>;
      };
    }).tokens;

    if (!tokens || typeof tokens.mint !== 'function') {
      throw new Error(
        'Generic token mint is not available on this SDK version. ' +
          'Upgrade @aurigraph/dlt-sdk or use a use-case-specific mint endpoint.',
      );
    }

    const result = await tokens.mint(assetId, { toAddress, amount });
    return {
      tokenId: result.tokenId ?? assetId,
      txHash: result.txHash ?? 'pending',
    };
  }`;

  return useCase === 'BATTUA' ? battuaMint : genericMint;
}

function renderAssembleMethod(tokenType: TokenType, hookDesc: string | undefined): string {
  if (tokenType !== 'COMPOSITE') return '';
  return `
  /**
   * STAGE 5 (COMPOSITE only): Assemble Composite Token
   *
   * Called when: ${hookDesc ?? 'when all components are collected'}
   *
   * Bundles PRIMARY + SECONDARY + DEVICE components into a single composite
   * token. The server computes bundle_hash and commits to the Merkle tree.
   */
  async assembleComposite(params: {
    primaryAssetId: string;
    components: Array<{ assetId: string; role: 'DEVICE' | 'TRANSLATION' | 'EDITORIAL' }>;
    ownerId: string;
  }): Promise<{ compositeTokenId: string; bundleHash: string }> {
    const assemble = (
      this.client.registries as unknown as {
        provenews?: {
          tokens?: {
            assembleComposite?: (body: unknown) => Promise<{
              tokenId?: string;
              bundleHash?: string;
            }>;
          };
        };
      }
    ).provenews?.tokens?.assembleComposite;

    if (!assemble) {
      throw new Error(
        'provenews.tokens.assembleComposite is not available on this SDK version.',
      );
    }

    const result = await assemble({
      primaryAssetId: params.primaryAssetId,
      components: params.components,
      ownerId: params.ownerId,
    });
    return {
      compositeTokenId: result.tokenId ?? params.primaryAssetId,
      bundleHash: result.bundleHash ?? '',
    };
  }`;
}

function renderDeriveMethod(tokenType: TokenType): string {
  if (tokenType !== 'SECONDARY') return '';
  return `
  /**
   * SECONDARY-only: Derive a yield/fractional token from a primary asset.
   *
   * Requires scope: contracts:write
   */
  async deriveToken(params: {
    primaryAssetId: string;
    tokenClass: 'YIELD' | 'FRACTIONAL' | 'DEBT';
    totalSupply: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ derivedTokenId: string }> {
    const derive = (
      this.client.registries as unknown as {
        derive?: (body: unknown) => Promise<{ tokenId?: string }>;
      }
    ).derive;

    if (!derive) {
      throw new Error(
        'registries.derive is not available on this SDK version — upgrade @aurigraph/dlt-sdk.',
      );
    }
    const result = await derive({
      primaryAssetId: params.primaryAssetId,
      tokenClass: params.tokenClass,
      totalSupply: params.totalSupply,
      metadata: params.metadata ?? {},
    });
    return { derivedTokenId: result.tokenId ?? '' };
  }`;
}

export function renderService(input: ServiceTemplateInput): string {
  const metadataMapping = renderMetadataMapping(input.fields);
  const mintMethod = renderMintMethod(input.tokenType, input.useCase, input.hooks.onMint);
  const assembleMethod = renderAssembleMethod(input.tokenType, input.hooks.onAssemble);
  const deriveMethod = renderDeriveMethod(input.tokenType);

  return `// Auto-generated by @aurigraph/dlt-sdk tokenize
// Generated at: ${input.generatedAt}
// Use case:       ${input.useCase}
// Token type:     ${input.tokenType}
// DMRV framework: ${input.dmrvFramework}
// Jurisdiction:   ${input.jurisdiction}
//
// Do not edit — re-run the wizard to regenerate. Safe to extend with new
// methods; do not modify the generated methods below (they will be
// overwritten on the next \`tokenize\` run).

import { AurigraphClient } from '@aurigraph/dlt-sdk';
import { AURIGRAPH_TOKENIZATION, type MyAsset } from './aurigraph-tokenization.config.js';

/**
 * Thin wrapper over {@link AurigraphClient} that implements the 5-stage
 * tokenization pipeline for use case = ${input.useCase}.
 *
 *   STAGE 1 — registerAsset      ${input.hooks.onRegister}
 *   STAGE 2 — recordDmrvEvent    ${input.hooks.onMonitoring}
 *   STAGE 3 — verifyAsset        ${input.hooks.onVerification}
 *   STAGE 4 — mintToken          ${input.hooks.onMint}${
   input.tokenType === 'COMPOSITE'
     ? `\n *   STAGE 5 — assembleComposite ${input.hooks.onAssemble ?? ''}`
     : ''
 }
 */
export class AurigraphTokenizationService {
  private readonly client: AurigraphClient;

  constructor(client?: AurigraphClient) {
    this.client =
      client ??
      new AurigraphClient({
        baseUrl: AURIGRAPH_TOKENIZATION.baseUrl,
        appId: AURIGRAPH_TOKENIZATION.appId,
        apiKey: AURIGRAPH_TOKENIZATION.apiKey,
        autoHandshake: true,
        autoHeartbeat: true,
        onHandshake: (hello) => {
          // eslint-disable-next-line no-console
          console.log(
            '[aurigraph] connected as ' +
              hello.appName +
              ' — scopes: ' +
              hello.approvedScopes.join(', '),
          );
        },
      });
  }

  /**
   * STAGE 1: Register Asset
   *
   * Called when: ${input.hooks.onRegister}
   *
   * Maps your app's asset model to the Aurigraph ledger. For COMPOSITE
   * tokens, this call creates the PRIMARY asset; components are added later
   * via {@link assembleComposite}.
   *
   * Requires scope: registry:write
   */
  async registerAsset(asset: MyAsset): Promise<{ aurigraphAssetId: string }> {
    const register = (
      this.client.registries as unknown as {
        provenews?: {
          registerAsset?: (body: unknown) => Promise<{ assetId?: string }>;
        };
      }
    ).provenews?.registerAsset;

    if (!register) {
      throw new Error(
        'provenews.registerAsset is not available on this SDK version.',
      );
    }

    const assetLike = asset as unknown as {
      assetId?: string;
      ownerId?: string;
      contentHash?: string;
    };

    const result = await register({
      assetType: '${input.tokenType}',
      contentHash: assetLike.contentHash ?? '',
      ownerId: assetLike.ownerId ?? '',
      metadata: {
        useCase: AURIGRAPH_TOKENIZATION.useCase,
        framework: AURIGRAPH_TOKENIZATION.dmrvFramework,
        jurisdiction: AURIGRAPH_TOKENIZATION.jurisdiction,
${metadataMapping}
      },
    });
    return { aurigraphAssetId: result.assetId ?? assetLike.assetId ?? '' };
  }

  /**
   * STAGE 2: Record DMRV Event
   *
   * Called when: ${input.hooks.onMonitoring}
   *
   * DMRV = Digital Monitoring, Reporting, Verification.
   * Framework: ${input.dmrvFramework}
   *
   * Requires scope: dmrv:write
   */
  async recordDmrvEvent(params: {
    assetId: string;
    eventType: 'BASELINE' | 'MONITORING' | 'VERIFICATION' | 'ATTESTATION';
    quantity: number;
    unit: string;
  }): Promise<void> {
    await this.client.dmrv.recordEvent({
      deviceId: params.assetId,
      eventType: params.eventType,
      quantity: params.quantity,
      unit: params.unit,
      timestamp: new Date().toISOString(),
    } as unknown as Parameters<typeof this.client.dmrv.recordEvent>[0]);
  }

  /**
   * STAGE 3: Verify Asset
   *
   * Called when: ${input.hooks.onVerification}
   *
   * Records a DMRV VERIFICATION event carrying the attestation payload. For
   * use cases that need a dedicated verifier call (gold LBMA, EU Battery
   * Passport, etc.) extend this method to hit the appropriate endpoint.
   *
   * Requires scope: dmrv:write
   */
  async verifyAsset(assetId: string, attestation: string): Promise<void> {
    await this.recordDmrvEvent({
      assetId,
      eventType: 'VERIFICATION',
      quantity: 1,
      unit: attestation,
    });
  }
${mintMethod}
${assembleMethod}
${deriveMethod}
  /**
   * Access the underlying {@link AurigraphClient} for advanced flows not
   * covered by the wizard-generated methods.
   */
  get raw(): AurigraphClient {
    return this.client;
  }

  /**
   * Graceful shutdown — stops the auto-heartbeat timer so your process can
   * exit cleanly. Call from your app's shutdown hook.
   */
  dispose(): void {
    this.client.dispose();
  }
}
`;
}
