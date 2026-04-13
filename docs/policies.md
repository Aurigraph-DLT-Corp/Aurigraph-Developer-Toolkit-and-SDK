# Platform Policies

This document summarizes the legal and operational policies that govern SDK usage. Full legal text is available at `dlt.aurigraph.io`.

## Required Reading

Before using the SDK in production, review these documents:

| Document | URL | Covers |
|----------|-----|--------|
| **Terms of Service** | `/terms` | Usage rights, service levels, liability |
| **Privacy Policy** | `/privacy` | What we collect, why, how long we keep it |
| **EULA** | `/eula` | End User License Agreement for the SDK libraries |
| **Data Processing Agreement** | `/dpa` | GDPR Article 28 processor obligations |
| **Acceptable Use Policy** | `/acceptable-use` | What you can and can't do with the API |
| **Cookie Policy** | `/cookies` | Session cookies, PostHog analytics, PKCE storage |
| **IP Notice** | `/ip-notice` | PCT patents, trademarks, DMCA |
| **Open Source Licenses** | `/licenses` | Attribution for all bundled OSS |
| **Regulatory Compliance** | `/regulatory` | EU, India, FATF, Singapore, UAE, SA |
| **Security Disclosure** | `/security` | How to report vulnerabilities |
| **Accessibility** | `/accessibility` | WCAG 2.1 AA commitment |
| **Disclaimer** | `/disclaimer` | No warranty, risk acknowledgement |

## Policy Summary

### Terms of Service

Key provisions:
- **Uptime SLA**: 99.9% per calendar month (ENTERPRISE only; STARTER/BUSINESS get best-effort)
- **Support response**: 24h (BUSINESS), 4h (ENTERPRISE), community-only (SANDBOX/STARTER)
- **Termination**: 30-day notice for convenience; immediate for abuse
- **Liability cap**: 12 months of paid fees (no cap for willful misconduct or IP infringement)
- **Governing law**: Delaware, USA (platform company); disputes via JAMS arbitration

### Acceptable Use Policy — Prohibited Activities

The API MUST NOT be used for:

1. **Illegal tokenization** — assets prohibited by applicable jurisdiction (narcotics, weapons, counterfeits)
2. **Money laundering** — structuring transactions to evade AML reporting
3. **Fraud / market manipulation** — wash trading, pump-and-dump, spoofing
4. **SDK abuse** — exceeding rate limits, scraping, reverse engineering
5. **Token misuse** — using test tokens to deceive, misrepresenting token rights
6. **Network abuse** — DDoS, spam transactions, consensus manipulation
7. **Content integrity violations** — false DMRV claims, fake carbon credits
8. **Circumventing compliance** — bypassing KYC tiers, geoblocking, sanctions

Enforcement is graduated:
- **Warning** → **Scope reduction** → **Suspension** → **Termination** → **Legal action**

### Privacy Policy

**What we collect**:
- Partner account info (name, email, company)
- API usage logs (endpoints called, timestamps, IPs)
- Technical telemetry (PostHog events — opt-out supported)

**What we DON'T collect**:
- Transaction payload contents (encrypted end-to-end)
- Personal data of YOUR end users (unless you explicitly send it)
- Biometric or sensitive categories (GDPR Art. 9)

**Retention**:
- Active account data: indefinite
- Deleted accounts: 30 days (GDPR Art. 17 compliance window)
- API logs: 90 days
- Support tickets: 3 years

**Transfers**:
- EU → US transfers use Standard Contractual Clauses (SCCs, 2021 version)
- Data stays in EU-based infrastructure for EU customers (request via ENTERPRISE tier)

### Data Processing Agreement (GDPR Art. 28)

When you integrate your end users' personal data with our platform, we become a **processor** and you the **controller**. The DPA at `/dpa` formalizes this relationship:

- **Scope**: Processing limited to documented instructions
- **Sub-processors**: PostHog (analytics), Keycloak (auth) — listed in DPA annex
- **Breach notification**: 72 hours from discovery
- **Audit rights**: Annual SOC 2 report; on-request audit with 30-day notice
- **International transfers**: SCCs for EU→US; adequacy decisions where available
- **End of processing**: Data returned or deleted within 30 days of contract end

By using the SDK in production, you're deemed to have signed the DPA. ENTERPRISE tier customers execute a countersigned version with bespoke terms.

### IP Notice

**Patents**: The platform is covered by 18 PCT patent applications (PCT-AUR-001 through PCT-AUR-018). Filing details in `/ip-notice`. Using the SDK grants you a non-exclusive license to the claimed methods strictly for SDK integration purposes.

**Trademarks**: Aurigraph, Aurigraph DLT, Battua, Provenews, HyperRAFT++ are trademarks of Aurigraph DLT Corp. Attribution required when referencing these marks.

**Copyright**:
- Platform core: Proprietary (Aurigraph DLT Corp, 2025-2026)
- SDK libraries (java/, typescript/, python/, rust/, ios/, android/): Proprietary, royalty-free license for SDK integration
- Bundled OSS: Licensed under their respective licenses (see `/licenses`)

**DMCA**: Report infringement to `legal@aurigraph.io` with the information required by 17 U.S.C. § 512(c)(3).

### Regulatory Compliance

The platform includes 65 built-in compliance frameworks. Using them correctly is YOUR responsibility:

- **EU**: MiCA, SFDR, EU Taxonomy, AMLD6, GDPR, EU AI Act, CBAM, EU Battery Regulation
- **India**: PMLA, FEMA, GST, BIS, RERA, NBFC, AIS 156
- **International**: FATF-40, UNCITRAL, ISO 28000, ISO 14064
- **Singapore**: MAS DPT (Digital Payment Tokens)
- **UAE**: CBUAE, DMCC, VAT, AML
- **South Africa**: FICA, SARB

The SDK exposes these via `client.compliance().listFrameworks()`. Consult your own counsel before relying on any framework assessment for regulatory filings.

### Security Disclosure

Found a vulnerability? Please report responsibly:

- **Email**: `security@aurigraph.io`
- **PGP**: Key published at `dlt.aurigraph.io/.well-known/pgp-key.asc`
- **Response SLAs**:
  - Acknowledgement: 24 hours
  - Triage: 72 hours
  - Fix: 30 days (critical), 90 days (high), 180 days (medium/low)

**Safe harbor**: Good-faith research is welcome. We won't pursue legal action against researchers who:
- Don't violate privacy or data integrity
- Don't disrupt service
- Give us reasonable time to fix before public disclosure
- Don't exploit for financial gain

**Out of scope**: DoS, social engineering, physical attacks, third-party services.

**Bounty**: Discretionary (case-by-case). Public Hall of Fame at `dlt.aurigraph.io/security`.

## Compliance Certifications

Aspirational (in progress):
- **SOC 2 Type II** — target Q4 2026
- **ISO 27001** — target Q1 2027
- **PCI DSS Level 1** — target Q2 2027 (if Battua payment volume warrants)

Current:
- **GDPR** — compliant design, patented erasure mechanism
- **WCAG 2.1 AA** — Partially conformant (enterprise portal)

## Acceptable Use Enforcement

We monitor for policy violations automatically:

- Rate limit spikes → token bucket enforcement (layer 1)
- Scope abuse → CDI interceptor rejection (layer 2)
- Quota exhaustion → atomic DB rejection (layer 3)
- Pattern anomalies → ML-based fraud detection (alerts human review)
- OFAC list hits → automatic transaction blocking

Suspected violations trigger a review. You'll receive an email with 7 days to respond before any account action.

## Amendment Process

Policies change. We notify you via:

1. **Email** to the registered partner contact
2. **Dashboard banner** at `/sdk-admin`
3. **Changelog entry** in `CHANGELOG.md`

Material changes (pricing, data handling, legal basis) give you 30 days notice before taking effect. Continuing to use the SDK after the effective date = acceptance.

## Contact

- **Legal questions**: `legal@aurigraph.io`
- **Privacy / DPA**: `privacy@aurigraph.io` / `dpa@aurigraph.io`
- **Compliance**: `compliance@aurigraph.io`
- **Abuse / fraud**: `abuse@aurigraph.io`
- **Patents / IP**: `patents@aurigraph.io`
- **General support**: `support@aurigraph.io`

## See Also

- [Registration](registration.md) — partner onboarding
- [GDPR Compliance](gdpr-compliance.md) — Article 17 and 20 implementation
- [Authentication](authentication.md) — how the SDK handles credentials
