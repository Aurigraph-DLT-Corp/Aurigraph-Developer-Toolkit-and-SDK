# PRIVACY LAWYER SKILL SPECIFICATION

**Skill Name**: `privacy-lawyer:review`
**Type**: Privacy & Data Protection Legal Expert
**Status**: Template for Implementation
**Created**: December 27, 2025

---

## 1. SKILL OVERVIEW

This Claude Code skill provides privacy and data protection legal expertise for Aurigraph DLT project, including:
- Privacy policy review and analysis
- GDPR/CCPA/CCPA compliance verification
- Data processing agreement (DPA) guidance
- Cookie policy and tracking analysis
- Cross-border data transfer compliance
- Privacy impact assessment (PIA) assistance
- Children's privacy and parental consent review
- Breach notification procedure verification
- Privacy by design consultation
- Third-party data sharing analysis

### Available Operations

```
/privacy-lawyer review         # Review privacy policies for compliance
/privacy-lawyer assess         # Assess privacy risks in data processing
/privacy-lawyer dpa            # Review Data Processing Agreements
/privacy-lawyer cookies        # Analyze cookie policies and tracking
/privacy-lawyer transfer       # Verify cross-border data transfer compliance
/privacy-lawyer breach         # Review breach notification procedures
/privacy-lawyer children       # Check children's privacy compliance
/privacy-lawyer vendors        # Assess third-party vendor privacy risks
/privacy-lawyer pia            # Generate Privacy Impact Assessment
/privacy-lawyer compliance     # Check regulatory compliance status
```

---

## 2. SKILL FRONTMATTER

```yaml
---
name: privacy-lawyer
description: >
  Privacy law expert providing comprehensive data protection guidance,
  privacy policy review, GDPR/CCPA compliance verification, breach notification
  procedures, cookie policy analysis, DPA review, and cross-border data transfer
  compliance for blockchain and web applications.

author: Aurigraph DLT Legal Team
version: 1.0.0
category: Legal & Compliance

tools:
  - Glob         # Search privacy documents
  - Grep         # Search privacy provisions
  - Read         # Read full policies
  - WebSearch    # Research privacy precedents
  - WebFetch     # Fetch regulatory guidance

tags:
  - privacy
  - data-protection
  - gdpr
  - ccpa
  - compliance
  - cookies
  - tracking
  - dpa
  - breach-notification
  - children-privacy

triggers:
  - "privacy lawyer"
  - "privacy policy"
  - "data protection"
  - "GDPR compliance"
  - "CCPA compliance"
  - "cookie policy"
  - "breach notification"
---
```

---

## 3. SKILL COMMANDS

### Command 1: Review Privacy Policies

```yaml
name: review
description: Review privacy policies for legal compliance

parameters:
  document:
    type: string
    description: "Document name (privacy-policy-platform, privacy-policy-website, etc.)"
  jurisdiction:
    type: string
    description: "Target jurisdiction (us, eu, uk, ca, etc.)"
  focus_areas:
    type: array
    description: "Specific areas to focus on (e.g., ['data-retention', 'user-rights', 'cookies'])"

examples:
  - "/privacy-lawyer review --document privacy-policy-platform --jurisdiction eu --focus-areas gdpr,data-retention,cookies"
  - "/privacy-lawyer review --document privacy-policy-website --jurisdiction us --focus-areas ccpa,tracking,third-parties"
```

### Command 2: Assess Privacy Risks

```yaml
name: assess
description: Assess privacy risks in data processing activities

parameters:
  activity:
    type: string
    description: "Data processing activity (e.g., 'user-registration', 'marketing-emails', 'analytics')"
  data_types:
    type: array
    description: "Types of data involved (e.g., ['personal-data', 'health-data', 'children-data'])"
  risk_level:
    type: enum
    values: [critical, high, medium, low]
    description: "Minimum risk level to report"

examples:
  - "/privacy-lawyer assess --activity user-registration --data-types personal-data,email --risk-level high"
  - "/privacy-lawyer assess --activity marketing-campaign --data-types personal-data,location --risk-level medium"
```

### Command 3: Review Data Processing Agreements

```yaml
name: dpa
description: Review and validate Data Processing Agreements

parameters:
  document:
    type: string
    description: "DPA document to review"
  processor:
    type: string
    description: "Name of data processor"
  jurisdiction:
    type: string
    description: "Jurisdiction of processing"

examples:
  - "/privacy-lawyer dpa --document google-analytics-dpa --processor 'Google LLC' --jurisdiction eu"
  - "/privacy-lawyer dpa --document stripe-dpa --processor 'Stripe Inc' --jurisdiction us"
```

### Command 4: Analyze Cookie Policies

```yaml
name: cookies
description: Analyze cookie policies and tracking mechanisms

parameters:
  document:
    type: string
    description: "Cookie policy document to analyze"
  tracking_tools:
    type: array
    description: "Tracking tools used (e.g., ['google-analytics', 'hotjar', 'facebook-pixel'])"
  jurisdiction:
    type: string
    description: "Target jurisdiction"

examples:
  - "/privacy-lawyer cookies --document cookie-policy --tracking-tools google-analytics,hotjar,facebook-pixel --jurisdiction eu"
```

### Command 5: Verify Cross-Border Data Transfer

```yaml
name: transfer
description: Verify compliance for cross-border data transfers

parameters:
  source_jurisdiction:
    type: string
    description: "Origin jurisdiction (e.g., 'eu', 'us')"
  destination_jurisdiction:
    type: string
    description: "Destination jurisdiction"
  data_types:
    type: array
    description: "Types of data being transferred"

examples:
  - "/privacy-lawyer transfer --source-jurisdiction eu --destination-jurisdiction us --data-types personal-data,health-data"
  - "/privacy-lawyer transfer --source-jurisdiction uk --destination-jurisdiction us --data-types customer-data"
```

### Command 6: Review Breach Notification Procedures

```yaml
name: breach
description: Review breach notification procedures and compliance

parameters:
  document:
    type: string
    description: "Breach notification procedure document"
  jurisdiction:
    type: string
    description: "Applicable jurisdiction"
  notification_timeline:
    type: string
    description: "Required notification timeline (e.g., '72 hours')"

examples:
  - "/privacy-lawyer breach --document breach-procedures --jurisdiction eu --notification-timeline 72-hours"
  - "/privacy-lawyer breach --document incident-response --jurisdiction us --notification-timeline immediate"
```

### Command 7: Check Children's Privacy

```yaml
name: children
description: Verify children's privacy compliance (COPPA, GDPR Article 8)

parameters:
  document:
    type: string
    description: "Privacy policy or terms to check for children's compliance"
  age_limit:
    type: integer
    description: "Age threshold (13 for COPPA, 16 for GDPR)"
  jurisdiction:
    type: string
    description: "Target jurisdiction"

examples:
  - "/privacy-lawyer children --document privacy-policy --age-limit 13 --jurisdiction us"
  - "/privacy-lawyer children --document terms-website --age-limit 16 --jurisdiction eu"
```

### Command 8: Assess Vendor Privacy Risks

```yaml
name: vendors
description: Assess privacy risks from third-party vendors and processors

parameters:
  vendor_list:
    type: array
    description: "List of vendors to assess (e.g., ['Google', 'Stripe', 'AWS'])"
  data_access_level:
    type: enum
    values: [processor, controller, limited-access]
    description: "Level of access vendors have to data"
  jurisdiction:
    type: string
    description: "Applicable jurisdiction"

examples:
  - "/privacy-lawyer vendors --vendor-list google,stripe,aws --data-access-level processor --jurisdiction eu"
  - "/privacy-lawyer vendors --vendor-list mailchimp,segment,google-analytics --data-access-level processor --jurisdiction us"
```

### Command 9: Generate Privacy Impact Assessment

```yaml
name: pia
description: Generate Privacy Impact Assessment (PIA) for new processing activities

parameters:
  activity:
    type: string
    description: "Data processing activity description"
  data_types:
    type: array
    description: "Types of data involved"
  scale:
    type: enum
    values: [high-risk, medium-risk, low-risk]
    description: "Risk scale of the processing"

examples:
  - "/privacy-lawyer pia --activity 'AI-driven recommendation engine' --data-types personal-data,behavioral-data --scale high-risk"
  - "/privacy-lawyer pia --activity 'Email marketing campaign' --data-types email,name --scale low-risk"
```

### Command 10: Check Compliance Status

```yaml
name: compliance
description: Check regulatory compliance status across multiple frameworks

parameters:
  document:
    type: string
    description: "Document to check"
  regulations:
    type: array
    values: [gdpr, ccpa, cpra, lgpd, pipl, casl, pipeda]
    description: "Regulations to verify compliance with"

examples:
  - "/privacy-lawyer compliance --document privacy-policy --regulations gdpr,ccpa,cpra,lgpd"
  - "/privacy-lawyer compliance --document cookie-policy --regulations gdpr,casl,pipeda"
```

---

## 4. IMPLEMENTATION GUIDE

### Step 1: Create Skill File

Create file: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/.claude/skills/privacy-lawyer.md`

```markdown
---
name: privacy-lawyer
description: Privacy law expert for data protection, compliance, and breach procedures
version: 1.0.0
---

# Privacy Lawyer Skill

[Implementation content here]
```

### Step 2: Register Commands

Register each command handler:
- `review` - Privacy policy review processor
- `assess` - Privacy risk assessment engine
- `dpa` - Data Processing Agreement validator
- `cookies` - Cookie policy analyzer
- `transfer` - Cross-border transfer compliance checker
- `breach` - Breach notification procedure validator
- `children` - Children's privacy compliance checker
- `vendors` - Third-party vendor risk assessor
- `pia` - Privacy Impact Assessment generator
- `compliance` - Regulatory compliance checker

### Step 3: Configure Tools

Enable access to:
- `Glob` - Find privacy documents
- `Grep` - Search privacy text
- `Read` - Read full policies
- `WebSearch` - Research privacy law
- `WebFetch` - Fetch regulatory guidance

---

## 5. CORE COMPETENCIES

### Privacy Policy Review

The skill can:
- ✓ Review Privacy Policies for GDPR/CCPA compliance
- ✓ Verify all required disclosures are present
- ✓ Check user rights are properly documented
- ✓ Identify missing or inadequate provisions
- ✓ Flag legal risks and exposure
- ✓ Suggest specific improvements
- ✓ Verify cookie and tracking disclosures
- ✓ Assess data retention policies

**Key Areas**:
- GDPR Articles 13-14 (privacy notices)
- GDPR Articles 15-22 (user rights)
- CCPA §1798.100 (notice requirements)
- CCPA §1798.100-120 (user rights)
- Cookie law compliance (ePrivacy Directive)
- Tracking technology disclosure
- Third-party service disclosure
- Data retention and deletion policies

### Data Protection Compliance

The skill verifies:
- ✓ **GDPR**: All articles 13-14 (disclosure) and 15-22 (rights) implemented
- ✓ **CCPA/CPRA**: All §1798.100-120 requirements met
- ✓ **LGPD**: Brazilian data protection law compliance (Lei Geral de Proteção de Dados)
- ✓ **PIPL**: Chinese personal information protection law
- ✓ **CASL**: Canadian anti-spam legislation
- ✓ **PIPEDA**: Canada's personal information privacy law
- ✓ **Cookies**: Valid consent mechanisms documented
- ✓ **Tracking**: Google Analytics, Facebook Pixel, etc. properly disclosed
- ✓ **DPA**: Standard Contractual Clauses (SCCs) in place

### Risk Assessment

The skill identifies:
- ✓ **Disclosure Risks**: Missing or inadequate privacy notices
- ✓ **Rights Risks**: User rights not properly documented
- ✓ **Cookie Risks**: Invalid or missing consent mechanisms
- ✓ **Transfer Risks**: Inadequate cross-border transfer safeguards
- ✓ **Vendor Risks**: Unvetted third-party data processors
- ✓ **Breach Risks**: Inadequate breach notification procedures
- ✓ **Children's Risks**: Age verification gaps (under 13/16)
- ✓ **Retention Risks**: Excessive data retention periods

---

## 6. PRIVACY LAW EXPERTISE

### Regulatory Frameworks

**GDPR (EU Regulation 2016/679)**:
- Articles 13-14: Privacy notice requirements
- Articles 15-22: User rights (access, delete, portability, object, etc.)
- Article 9: Special categories (health, race, etc.)
- Article 21: Right to object
- Article 32: Data security requirements
- Article 33-34: Breach notification (72-hour requirement)

**CCPA (California Consumer Privacy Act)**:
- §1798.100: Right to know and delete
- §1798.105: Right to delete
- §1798.110: Disclosure requirements
- §1798.120: Right to opt-out of sale
- §1798.125: Non-discrimination
- §1798.150: Private right of action (penalties)

**CPRA (California Privacy Rights Act)**:
- Enhanced data minimization
- Expanded user rights (correct, limit use)
- Increased penalties ($7,500 per intentional violation)
- Automated decision-making disclosure
- Health data sensitivity

**LGPD (Lei Geral de Proteção de Dados - Brazil)**:
- Articles 1-5: Foundational principles
- Article 9: Lawful bases for processing
- Article 18: User rights
- Article 52: Breach notification requirements (without delay)

**PIPL (Personal Information Protection Law - China)**:
- Chapter 2: Principles and rules
- Chapter 3: Processing personal information
- Chapter 4: Organization responsibilities
- Chapter 5: Cross-border transfers

**CASL (Canada's Anti-Spam Law)**:
- Section 1-6: Commercial electronic messages
- Consent requirements (express or implied)
- Unsubscribe mechanism (within 10 days)
- Contact information disclosure

### Data Processing

**Lawful Bases for Processing**:
- Consent (Article 6(1)(a) GDPR)
- Contract (Article 6(1)(b) GDPR)
- Legal obligation (Article 6(1)(c) GDPR)
- Vital interests (Article 6(1)(d) GDPR)
- Public task (Article 6(1)(e) GDPR)
- Legitimate interests (Article 6(1)(f) GDPR)

**Data Processing Agreements (DPA)**:
- Standard Contractual Clauses (SCCs) for international transfers
- Data Processor Agreement requirements
- Sub-processor notification procedures
- Data subject rights fulfillment
- Security obligations documentation

**Cross-Border Transfers**:
- Adequacy decisions (EU-US, UK-US, etc.)
- Standard Contractual Clauses (SCCs)
- Binding Corporate Rules (BCRs)
- Supplementary measures documentation
- Personal data localization requirements

### Cookie & Tracking Compliance

**Cookie Categories**:
- Strictly necessary (no consent required)
- Performance/Analytics (requires consent)
- Marketing/Tracking (requires consent)
- Functional (preference-based)
- Advertising (targeted ads)

**Consent Requirements**:
- Affirmative action (not pre-checked boxes)
- Granular consent (per category)
- Easy withdrawal mechanism
- Valid before processing begins
- Clear cookie disclosure

**Third-Party Services**:
- Google Analytics GDPR compliance
- Facebook Pixel consent requirements
- Hotjar session recording disclosure
- Amplitude/Segment data sharing
- Mailchimp/marketing platform processor agreements

### Privacy by Design

**Principles**:
- Data minimization (collect only necessary data)
- Purpose limitation (use only for stated purposes)
- Accuracy (keep data accurate and current)
- Storage limitation (delete when no longer needed)
- Integrity and confidentiality (secure processing)
- Accountability (document compliance)

**Implementation**:
- Privacy Impact Assessments (PIA)
- Privacy notices before collection
- Consent mechanisms
- Data retention schedules
- Access controls and encryption
- Regular audits and assessments

---

## 7. USE CASES

### Use Case 1: Privacy Policy Pre-Publication Review

**Scenario**: Privacy policy ready for publication, needs legal review

**Skill Execution**:
```
/privacy-lawyer review
  --document privacy-policy-platform
  --jurisdiction eu
  --focus-areas gdpr,data-retention,cookies
```

**Output**:
- ✓ GDPR compliance status (Articles 13-14, 15-22)
- ✓ Data retention period review
- ✓ User rights documentation verification
- ✓ Cookie disclosure assessment
- ✓ Risk identification
- ✓ Recommended fixes

### Use Case 2: Privacy Risk Assessment for New Feature

**Scenario**: Planning AI-driven recommendation engine, need privacy impact

**Skill Execution**:
```
/privacy-lawyer assess
  --activity ai-recommendation-engine
  --data-types personal-data,behavioral-data,location-data
  --risk-level high
```

**Output**:
- ✓ Privacy impact assessment results
- ✓ Risk categorization (critical/high/medium/low)
- ✓ Required safeguards and mitigations
- ✓ Lawful basis analysis
- ✓ User notification requirements
- ✓ Compliance checklist

### Use Case 3: Cookie Policy Compliance Check

**Scenario**: Verify cookie policy complies with GDPR and ePrivacy Directive

**Skill Execution**:
```
/privacy-lawyer cookies
  --document cookie-policy
  --tracking-tools google-analytics,hotjar,facebook-pixel
  --jurisdiction eu
```

**Output**:
- ✓ Consent mechanism validation
- ✓ Service provider DPA verification
- ✓ Cookie category analysis
- ✓ Opt-out procedure review
- ✓ Do Not Track compliance check
- ✓ Recommended improvements

### Use Case 4: Cross-Border Data Transfer Verification

**Scenario**: Transfer EU customer data to US for processing, verify compliance

**Skill Execution**:
```
/privacy-lawyer transfer
  --source-jurisdiction eu
  --destination-jurisdiction us
  --data-types personal-data,health-data
```

**Output**:
- ✓ Transfer mechanism analysis (adequacy, SCCs, BCRs)
- ✓ Supplementary measures assessment
- ✓ Risk evaluation
- ✓ Recommended protective measures
- ✓ Compliance documentation checklist

### Use Case 5: Vendor Risk Assessment

**Scenario**: Evaluate privacy risks of third-party vendors before engagement

**Skill Execution**:
```
/privacy-lawyer vendors
  --vendor-list google-analytics,stripe,aws
  --data-access-level processor
  --jurisdiction eu
```

**Output**:
- ✓ Vendor DPA and security assessment
- ✓ Data access level verification
- ✓ Sub-processor notification review
- ✓ Risk categorization
- ✓ Required agreements checklist
- ✓ Ongoing monitoring recommendations

### Use Case 6: Breach Notification Procedure Review

**Scenario**: Verify breach notification procedures comply with GDPR requirements

**Skill Execution**:
```
/privacy-lawyer breach
  --document breach-procedures
  --jurisdiction eu
  --notification-timeline 72-hours
```

**Output**:
- ✓ 72-hour notification compliance
- ✓ Authority notification procedures
- ✓ Data subject notification requirements
- ✓ Documentation requirements
- ✓ Risk assessment procedures
- ✓ Public disclosure guidelines

---

## 8. KNOWLEDGE BASE

The skill leverages:

**Internal Documents** (in `/docs/legal/`):
- PRIVACY_POLICY_PLATFORM.md
- PRIVACY_POLICY_WEBSITE.md
- TERMS_AND_CONDITIONS_PLATFORM.md
- TERMS_AND_CONDITIONS_WEBSITE.md
- README.md (implementation guide)
- ACCELERATED_LEGAL_REVIEW_PLAN.md

**External References**:
- GDPR (EU Regulation 2016/679)
- CCPA (California Consumer Privacy Act)
- CPRA (California Privacy Rights Act)
- LGPD (Lei Geral de Proteção de Dados - Brazil)
- PIPL (Personal Information Protection Law - China)
- CASL (Canada's Anti-Spam Law)
- PIPEDA (Canada's Personal Information Privacy Law)
- ePrivacy Directive (Directive 2002/58/EC)
- Adequacy Decisions (EU-US, UK-US, etc.)
- Standard Contractual Clauses (SCCs)
- ICMEC Guidelines (children's privacy)
- NIST Privacy Engineering Practices

---

## 9. RESPONSE FORMAT

### Privacy Policy Review Response Template

```
# Privacy Policy Review: [Document Name]

## Jurisdiction: [Target Jurisdiction]

## Compliance Status
- GDPR Articles 13-14: ✅ Compliant / ⚠️ Needs fixes / ❌ Non-compliant
- GDPR Articles 15-22: ✅ Compliant / ⚠️ Needs fixes / ❌ Non-compliant
- CCPA §1798.100-120: ✅ Compliant / ⚠️ Needs fixes / ❌ Non-compliant
- Cookies & Tracking: ✅ Compliant / ⚠️ Needs fixes / ❌ Non-compliant

## Critical Issues (Blocks Publication)
1. Issue 1: [Description]
   - Regulation: [GDPR Article X, CCPA §Y, etc.]
   - Risk: [Legal exposure]
   - Fix: [Specific recommendation]

## Important Issues (Should Fix)
1. Issue 1: [Description]
   - Impact: [Legal risk]
   - Fix: [Specific recommendation]

## Minor Issues (Can Fix Later)
1. Issue 1: [Description]
   - Recommendation: [Enhancement]

## Privacy Risk Assessment
- Overall Risk Level: [Critical/High/Medium/Low]
- Data Minimization: [Assessment]
- User Rights Implementation: [Assessment]
- Consent Mechanisms: [Assessment]

## Recommended Actions
- [Action 1]
- [Action 2]
- [Action 3]

## Sign-Off Recommendation
Ready for publication: [Yes/No/With modifications]
Recommended next step: [Attorney review/Publication/Further customization]
```

---

## 10. INTEGRATION WITH PROJECT

### Integration Points

1. **Privacy Document Management**
   - Reviews all documents in `/docs/legal/`
   - Verifies compliance before publication
   - Tracks document versions and updates

2. **Data Protection Processes**
   - Analyzes new data processing activities
   - Generates Privacy Impact Assessments
   - Identifies legal risks early

3. **Third-Party Risk Management**
   - Evaluates vendor privacy practices
   - Assesses processor agreements
   - Tracks compliance status

4. **Incident Response**
   - Validates breach notification procedures
   - Ensures 72-hour GDPR compliance
   - Guides public disclosure decisions

5. **Regulatory Compliance**
   - Monitors multiple frameworks (GDPR, CCPA, LGPD, PIPL, CASL)
   - Tracks regulatory updates
   - Documents compliance evidence

### Team Access

**Who can use**:
- ✓ Privacy/Compliance officers
- ✓ Legal team members
- ✓ Product/Engineering teams (for assessments)
- ✓ Data Protection Officers (DPO)
- ✓ Security teams (for incident response)

**Access control**:
- Privacy policies: Available to authorized users
- Risk assessments: Available to all teams
- Compliance reviews: Privacy/Legal teams only
- Breach procedures: All teams (incident response)

---

## 11. ACCURACY & RELIABILITY

### Confidence Levels

The skill provides:
- **High Confidence** (95%+): Policy compliance checks, risk identification, requirement verification
- **Medium Confidence** (70-90%): Legal interpretation, recommendation prioritization
- **Lower Confidence** (<70%): Enforceability prediction (requires attorney verification)

### Important Disclaimers

**The skill:**
- ✓ Provides analysis and recommendations
- ✓ Identifies compliance gaps
- ✓ Verifies requirements
- ✗ Does NOT provide legal advice
- ✗ Cannot replace attorney review
- ✗ Cannot guarantee enforceability

**Required**: Attorney review before publication

---

## 12. FUTURE ENHANCEMENTS

### Phase 2 (v1.1)
- Automated DPA generator
- Privacy policy template builder
- Cookie consent management integration
- Vendor risk scoring system
- Regulatory update notifications

### Phase 3 (v2.0)
- AI-powered privacy assessment
- Automated PIA generation
- Real-time compliance monitoring
- Data flow mapping and analysis
- International privacy score comparison

---

## 13. HOW TO ENABLE THIS SKILL

### Option A: Manual Creation

1. Create file: `/.claude/skills/privacy-lawyer.md`
2. Add frontmatter with skill configuration
3. Register commands with handlers
4. Enable tool access

### Option B: Use Skill Development Tool

```
/skill-development create
  --name privacy-lawyer
  --description "Privacy law expert"
  --version 1.0.0
```

### Option C: Via Plugin Creation

```
/plugin-dev:skill-development
  Create privacy-lawyer skill with privacy review capabilities
```

---

## 14. QUICK START

### Get Privacy Policy Review

```
/privacy-lawyer review
  --document [document-name]
  --jurisdiction [target-jurisdiction]
```

### Assess Privacy Risks

```
/privacy-lawyer assess
  --activity [data-processing-activity]
  --data-types [data-type-list]
  --risk-level [critical|high|medium|low]
```

### Check Regulatory Compliance

```
/privacy-lawyer compliance
  --document [document-name]
  --regulations gdpr,ccpa,lgpd,pipl
```

### Analyze Cookie Policy

```
/privacy-lawyer cookies
  --document [document-name]
  --tracking-tools [tool-list]
  --jurisdiction [jurisdiction]
```

---

**This skill specification is ready for implementation.**

To enable this skill in Claude Code:
1. Copy this specification
2. Use skill development tools to create
3. Add to project's skill registry
4. Grant appropriate access permissions
5. Start using with `/privacy-lawyer` commands

---

**Created**: December 27, 2025
**Version**: 1.0.0
**Status**: Ready for Implementation
