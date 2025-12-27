# IP LAWYER SKILL SPECIFICATION

**Skill Name**: `ip-lawyer:review`
**Type**: Intellectual Property Legal Expert Agent
**Status**: Template for Implementation
**Created**: December 27, 2025

---

## 1. SKILL OVERVIEW

This Claude Code skill provides intellectual property (IP) legal expertise for Aurigraph DLT project, including:
- Patent analysis and protection
- Trademark registration and enforcement
- Copyright protection and licensing
- Trade secret identification and protection
- Open source license compliance
- IP ownership documentation
- Licensing agreement review

### Available Operations

```
/ip-lawyer review          # Review code for IP issues
/ip-lawyer patent          # Analyze patentability
/ip-lawyer trademark       # Check trademark availability
/ip-lawyer copyright       # Assess copyright protection
/ip-lawyer licensing       # Review license compliance
/ip-lawyer open-source     # Verify open source compliance
/ip-lawyer ownership       # Document IP ownership
```

---

## 2. SKILL FRONTMATTER

```yaml
---
name: ip-lawyer
description: >
  Intellectual property legal expert providing patent analysis, trademark registration guidance,
  copyright protection, trade secret identification, open source compliance verification,
  and IP ownership documentation for blockchain platforms and software.

author: Aurigraph DLT Legal Team
version: 1.0.0
category: Legal & Compliance

tools:
  - Glob         # Search code files
  - Grep         # Search for IP references
  - Read         # Read code and documentation
  - WebSearch    # Research patent/trademark databases
  - WebFetch     # Fetch USPTO/WIPO guidance

tags:
  - intellectual-property
  - patents
  - trademarks
  - copyrights
  - licensing
  - open-source
  - trade-secrets
  - ip-protection

triggers:
  - "ip lawyer"
  - "intellectual property"
  - "patent"
  - "trademark"
  - "copyright"
  - "open source"
  - "license compliance"
---
```

---

## 3. SKILL COMMANDS

### Command 1: Review Code for IP Issues

```yaml
name: review
description: Scan code for potential IP infringement or compliance issues

parameters:
  code_path:
    type: string
    description: "Path to code directory or file"
  focus_areas:
    type: array
    description: "IP areas to focus on (patents, copyrights, open-source)"
    values: [patents, copyrights, trademarks, open-source, trade-secrets]

examples:
  - "/ip-lawyer review --code_path src/ --focus_areas open-source,copyrights"
  - "/ip-lawyer review --code_path src/consensus/ --focus_areas patents"
```

### Command 2: Patent Analysis

```yaml
name: patent
description: Analyze code for patentability and existing patents

parameters:
  code_file:
    type: string
    description: "Code file to analyze for patentability"
  technology_area:
    type: enum
    values: [blockchain, consensus, cryptography, ai-optimization, cross-chain, rwa]
    description: "Technology area for patent search"
  search_scope:
    type: enum
    values: [us, international, full]
    description: "Patent search scope"

examples:
  - "/ip-lawyer patent --code_file consensus/HyperRAFTConsensusService.java --technology_area consensus --search_scope us"
  - "/ip-lawyer patent --code_file ai/AIOptimizationService.java --technology_area ai-optimization --search_scope international"
```

### Command 3: Trademark Check

```yaml
name: trademark
description: Check trademark availability and conflicts

parameters:
  name:
    type: string
    description: "Trademark name to check"
  categories:
    type: array
    description: "Trademark classes (Nice classes)"
  jurisdiction:
    type: enum
    values: [us, eu, international]
    description: "Jurisdiction to search"

examples:
  - "/ip-lawyer trademark --name 'Aurigraph DLT' --categories [software, blockchain, financial-services] --jurisdiction us"
  - "/ip-lawyer trademark --name 'HyperRAFT++' --categories [software] --jurisdiction international"
```

### Command 4: Copyright Assessment

```yaml
name: copyright
description: Assess copyright ownership and protection

parameters:
  asset:
    type: string
    description: "Asset to assess (code file, documentation, etc.)"
  asset_type:
    type: enum
    values: [source-code, documentation, artwork, design, algorithm]
    description: "Type of asset"
  ownership_status:
    type: enum
    values: [company, employee, contractor, open-source]
    description: "Current ownership assumption"

examples:
  - "/ip-lawyer copyright --asset src/consensus/ --asset_type source-code --ownership_status company"
  - "/ip-lawyer copyright --asset documentation/ --asset_type documentation --ownership_status company"
```

### Command 5: License Compliance

```yaml
name: licensing
description: Review and verify open source license compliance

parameters:
  code_path:
    type: string
    description: "Path to scan for dependencies"
  output_format:
    type: enum
    values: [summary, detailed, compliance-report]
    description: "Report format"

examples:
  - "/ip-lawyer licensing --code_path . --output_format compliance-report"
  - "/ip-lawyer licensing --code_path dependencies/ --output_format detailed"
```

### Command 6: Open Source Compliance

```yaml
name: open-source
description: Verify open source license compliance and attribution

parameters:
  repository:
    type: string
    description: "Repository or directory to scan"
  license_filter:
    type: array
    description: "Filter by license type (GPL, MIT, Apache, etc.)"

examples:
  - "/ip-lawyer open-source --repository . --license_filter GPL,AGPL"
  - "/ip-lawyer open-source --repository src/dependencies/ --license_filter 'copyleft-licenses'"
```

### Command 7: IP Ownership Documentation

```yaml
name: ownership
description: Document IP ownership and create assignment agreements

parameters:
  asset:
    type: string
    description: "Asset description"
  current_owner:
    type: string
    description: "Current owner"
  intended_owner:
    type: string
    description: "Intended owner"
  created_by:
    type: array
    description: "List of creators/contributors"

examples:
  - "/ip-lawyer ownership --asset 'HyperRAFT++ Consensus Algorithm' --current_owner 'John Smith' --intended_owner 'Aurigraph DLT' --created_by ['John Smith', 'Jane Doe']"
```

---

## 4. CORE COMPETENCIES

### Patent Protection

The skill can:
- ✓ Analyze code for patentable innovations
- ✓ Search existing patents for conflicts
- ✓ Identify invention disclosure items
- ✓ Assess novelty and non-obviousness
- ✓ Recommend patent filing strategy
- ✓ Draft patent application outlines

**Key Technologies**:
- HyperRAFT++ consensus algorithm
- AI optimization engine
- Quantum-resistant cryptography
- Cross-chain bridge technology
- Real-world asset tokenization
- Blockchain scaling solutions

### Trademark Protection

The skill can:
- ✓ Check trademark availability (USPTO, WIPO)
- ✓ Identify trademark conflicts
- ✓ Recommend registration strategy
- ✓ Draft trademark usage guidelines
- ✓ Monitor trademark infringement
- ✓ Document trademark ownership

**Brand Assets**:
- Aurigraph DLT™
- HyperRAFT++™
- AurCarbonTrace™
- AurHydroPulse™
- Company logos and designs

### Copyright Protection

The skill can:
- ✓ Establish copyright ownership
- ✓ Create copyright notices
- ✓ Document creation and modification dates
- ✓ Assess derivative work status
- ✓ Generate copyright registration recommendations
- ✓ Create copyright assignment agreements

**Copyrightable Assets**:
- Source code (automatic copyright)
- Documentation and guides
- Marketing materials
- Design and artwork
- Algorithms and specifications

### Open Source Compliance

The skill can:
- ✓ Identify all open source dependencies
- ✓ Check license compatibility
- ✓ Verify attribution requirements
- ✓ Identify copyleft restrictions
- ✓ Generate SBOM (Software Bill of Materials)
- ✓ Ensure license compliance

**License Categories**:
- Permissive (MIT, Apache 2.0, BSD)
- Copyleft (GPL, AGPL, LGPL)
- Proprietary and Commercial
- Dual-licensed components

### Trade Secret Protection

The skill can:
- ✓ Identify trade secrets
- ✓ Create protection procedures
- ✓ Generate NDAs and confidentiality agreements
- ✓ Document secrecy measures
- ✓ Assess trade secret loss risks
- ✓ Recommend protection strategies

**Trade Secrets**:
- Proprietary algorithms
- Performance optimizations
- Security vulnerabilities
- Architectural designs
- Pricing strategies

---

## 5. IP PROTECTION STRATEGY

### Asset Classification

**Patents** (Proprietary Algorithms):
- HyperRAFT++ consensus mechanism
- AI-driven transaction optimization
- Quantum cryptography implementation
- Cross-chain bridge protocols
- Real-world asset tokenization

**Trademarks** (Brand Identity):
- Aurigraph DLT™ (company name)
- HyperRAFT++™ (consensus algorithm)
- AurCarbonTrace™ (carbon tracking)
- AurHydroPulse™ (hydro monitoring)
- Logo and visual identity

**Copyrights** (Creative Works):
- Source code (automatic)
- Documentation and guides
- Marketing materials
- Design and UI elements
- Training materials

**Trade Secrets** (Confidential Info):
- Security vulnerabilities
- Performance optimization techniques
- Architectural patterns
- Business intelligence
- Customer lists

### IP Ownership Verification

The skill verifies:
- ✓ **Company Ownership**: Code written by employees
- ✓ **Work-for-Hire**: Contractor agreements
- ✓ **Open Source**: Proper license attribution
- ✓ **Third-Party**: Licensed technology
- ✓ **Mixed**: Clear demarcation of ownership

---

## 6. BLOCKCHAIN-SPECIFIC IP EXPERTISE

### Blockchain Patents

**Key Patent Areas**:
- Consensus mechanisms (HyperRAFT++)
- Smart contract execution
- Cross-chain communication
- Cryptographic protocols
- Performance optimization
- Scalability solutions

**Patent Research**:
- US Patent Office blockchain patents
- International Patent Cooperation Treaty (PCT)
- Defensive patent strategies
- Freedom-to-operate analysis

### Smart Contract IP

**Issues to Address**:
- Ownership of deployed contracts
- Patent infringement in contract code
- Copyright in contract interfaces
- Trade secret protection in contract logic
- License compliance in contract dependencies

### Cryptocurrency IP

**Special Considerations**:
- Token design and mechanics
- Tokenomics documentation
- Protocol specifications
- Network governance
- Upgrade procedures

---

## 7. OPEN SOURCE COMPLIANCE

### Common License Types

**Permissive Licenses**:
- MIT License: Very permissive, minimal restrictions
- Apache 2.0: Includes patent protection
- BSD 3-Clause: Similar to MIT with additional terms
- ISC License: Simplified BSD equivalent

**Copyleft Licenses**:
- GPL v2/v3: Strong copyleft, requires derivative disclosure
- AGPL: Network copyleft (affects SaaS)
- LGPL: Weak copyleft, allows linking
- EUPL: European Union copyleft

**Hybrid/Dual Licensing**:
- Commercial + open source
- Tiered licensing models
- Commons Clause (restricts commercial use)

### License Compatibility Matrix

**Compatible Combinations**:
- ✓ MIT + Apache 2.0 → Use Apache 2.0
- ✓ MIT + BSD → Use MIT or BSD
- ✓ Apache 2.0 + LGPL → Use Apache 2.0
- ✗ MIT + GPL v3 → Incompatible (use GPL v3)
- ✗ Apache 2.0 + GPL v2 → Incompatible

---

## 8. PATENT FILING STRATEGY

### Invention Disclosure Process

1. **Identify Patentable Inventions**
   - HyperRAFT++ consensus improvements
   - AI optimization algorithms
   - Quantum cryptography applications
   - Cross-chain bridge innovations

2. **Prepare Invention Disclosures**
   - Technical description
   - Problem solved
   - Prior art search results
   - Novelty assessment
   - Non-obviousness justification

3. **File Patent Applications**
   - Provisional patent application (first)
   - Utility patent application (within 12 months)
   - International PCT application (within 12 months)

4. **Monitor and Maintain**
   - Pay maintenance fees
   - File office actions responses
   - Track competitor patents
   - Consider licensing opportunities

---

## 9. TRADEMARK STRATEGY

### Trademark Registration Process

1. **Conduct Availability Search**
   - USPTO database search
   - Common law use search
   - International search (WIPO)
   - Domain name availability

2. **File Applications**
   - Intent-to-Use (ITU) applications
   - File in relevant classes
   - Multiple jurisdictions if needed
   - Maintain portfolio

3. **Use and Enforcement**
   - Display trademark notices
   - Create usage guidelines
   - Monitor for infringement
   - Take enforcement action

4. **Maintain Protection**
   - File renewals (10 years + indefinite)
   - Document use and quality control
   - Update assignments and licenses
   - Defend against challenges

---

## 10. USE CASES

### Use Case 1: Patent Analysis

**Scenario**: New AI optimization algorithm developed, needs patent protection

**Skill Execution**:
```
/ip-lawyer patent
  --code_file src/ai/AIOptimizationService.java
  --technology_area ai-optimization
  --search_scope international
```

**Output**:
- ✓ Patentability assessment
- ✓ Similar patent analysis
- ✓ Novelty assessment
- ✓ Filing recommendations
- ✓ Timeline and cost estimate

### Use Case 2: Open Source Compliance Check

**Scenario**: Need to verify all dependencies are properly licensed

**Skill Execution**:
```
/ip-lawyer open-source
  --repository .
  --license_filter 'copyleft-licenses'
```

**Output**:
- ✓ All dependencies identified
- ✓ License compatibility matrix
- ✓ Compliance status
- ✓ Conflict resolution recommendations
- ✓ SBOM (Software Bill of Materials)

### Use Case 3: Copyright Assignment Documentation

**Scenario**: Need to formalize IP ownership for contractor-developed code

**Skill Execution**:
```
/ip-lawyer ownership
  --asset 'Cross-Chain Bridge Implementation'
  --current_owner 'Jane Contractor'
  --intended_owner 'Aurigraph DLT'
  --created_by ['Jane Contractor']
```

**Output**:
- ✓ Assignment agreement template
- ✓ Copyright notice recommendations
- ✓ Ownership documentation
- ✓ Legal requirements checklist
- ✓ Signature requirements

### Use Case 4: Trademark Availability Check

**Scenario**: Brand expansion to new markets

**Skill Execution**:
```
/ip-lawyer trademark
  --name 'Aurigraph DLT'
  --categories [software, blockchain, financial-services]
  --jurisdiction international
```

**Output**:
- ✓ USPTO availability status
- ✓ WIPO international status
- ✓ Conflicts identified
- ✓ Registration recommendations
- ✓ Geographic strategy

### Use Case 5: Code Review for IP Issues

**Scenario**: Quarterly IP compliance review of codebase

**Skill Execution**:
```
/ip-lawyer review
  --code_path src/
  --focus_areas patents,copyrights,open-source,trade-secrets
```

**Output**:
- ✓ Patent conflict analysis
- ✓ Copyright ownership verification
- ✓ Open source compliance status
- ✓ Trade secret identification
- ✓ Overall IP health assessment

---

## 11. RESPONSE FORMAT

### Patent Analysis Response Template

```
# Patent Analysis: [Technology/File]

## Patentability Assessment
- Overall: [Highly Patentable / Patentable / Marginal / Not Patentable]
- Novelty: ✓ Novel / ⚠️ Some Prior Art / ❌ Prior Art Exists
- Non-Obvious: ✓ Non-Obvious / ⚠️ Questionable / ❌ Obvious
- Utility: ✓ Useful / ⚠️ Unclear / ❌ Not Useful

## Prior Art Search Results
- Related Patents Found: [Number]
- Most Similar: [Patent details]
- Key Differences: [What makes invention novel]

## Filing Recommendation
- Patent Type: [Utility / Design / Plant]
- Scope: [US Only / International (PCT)]
- Timeline: [File by [date]]
- Estimated Cost: [Range]

## Invention Description
[Key aspects of the invention]

## Claims Strategy
[Recommended claim language approach]

## Next Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
```

### Open Source Compliance Response Template

```
# Open Source Compliance Report

## Summary
- Total Dependencies: [Number]
- Compliant: [Number] ✓
- Issues Found: [Number] ⚠️
- Overall Status: [Compliant / Needs Fixes / Non-Compliant]

## License Inventory
| Library | License | Status | Action Required |
|---------|---------|--------|-----------------|
| [lib] | [license] | ✓/⚠️ | [action] |

## Issues Identified
1. **Critical**: [Issue description] - Fix Required
2. **Important**: [Issue description] - Recommended Fix
3. **Minor**: [Issue description] - Optional Enhancement

## Recommendations
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]

## Attribution Requirements
- Add LICENSES/ directory
- Include NOTICE file
- Add attribution in docs
- Update dependency documentation

## Next Steps
1. Address critical issues
2. Implement attribution
3. Maintain SBOM
4. Quarterly reviews
```

---

## 12. INTEGRATION WITH PROJECT

### Integration Points

1. **Code Review Process**
   - IP analysis during code review
   - Patent conflict checking
   - Copyright ownership verification
   - License compliance checking

2. **Documentation**
   - Copyright notices in all files
   - License attribution in documentation
   - Patent/trademark usage guidelines
   - IP ownership documentation

3. **Development Workflow**
   - Check patent/trademark availability before naming
   - Verify license compliance before adding dependencies
   - Document IP ownership for all code
   - Track invention disclosures

4. **Release Process**
   - Generate SBOM for releases
   - Verify all licenses included
   - Check for patent issues
   - Confirm trademark compliance

---

## 13. IP PORTFOLIO MANAGEMENT

### Track and Maintain

**Patents**:
- [ ] File invention disclosures
- [ ] File provisional applications
- [ ] File utility patents
- [ ] File international applications
- [ ] Pay maintenance fees
- [ ] Monitor competitor patents

**Trademarks**:
- [ ] Register key brands
- [ ] Monitor use and quality
- [ ] Create usage guidelines
- [ ] Renew registrations (10-year cycle)
- [ ] File office actions
- [ ] Monitor for infringement

**Copyrights**:
- [ ] Add copyright notices
- [ ] Document creation dates
- [ ] Create assignment agreements
- [ ] Register with Copyright Office (optional but recommended)
- [ ] Monitor for infringement

**Trade Secrets**:
- [ ] Identify trade secrets
- [ ] Implement protection procedures
- [ ] Create NDAs
- [ ] Limit access
- [ ] Monitor for leaks

---

## 14. HOW TO ENABLE THIS SKILL

### Option A: Manual Creation

1. Create file: `/.claude/skills/ip-lawyer.md`
2. Add frontmatter with skill configuration
3. Register commands with handlers
4. Enable tool access

### Option B: Use Skill Development Tool

```
/skill-development create
  --name ip-lawyer
  --description "IP legal expert"
  --version 1.0.0
```

### Option C: Via Plugin Creation

```
/plugin-dev:skill-development
  Create ip-lawyer skill with patent and trademark expertise
```

---

## 15. QUICK START

### Analyze Code for Patents

```
/ip-lawyer patent
  --code_file [file-name]
  --technology_area [area]
  --search_scope us
```

### Check Open Source Compliance

```
/ip-lawyer open-source
  --repository .
  --license_filter 'copyleft-licenses'
```

### Verify Copyright Ownership

```
/ip-lawyer copyright
  --asset [code-path]
  --asset_type source-code
  --ownership_status company
```

### Document IP Ownership

```
/ip-lawyer ownership
  --asset '[invention description]'
  --current_owner '[creator]'
  --intended_owner 'Aurigraph DLT'
```

---

**This skill specification is ready for implementation.**

To enable this skill in Claude Code:
1. Copy this specification
2. Use skill development tools to create
3. Add to project's skill registry
4. Grant appropriate access permissions
5. Start using with `/ip-lawyer` commands

---

**Created**: December 27, 2025
**Version**: 1.0.0
**Status**: Ready for Implementation
