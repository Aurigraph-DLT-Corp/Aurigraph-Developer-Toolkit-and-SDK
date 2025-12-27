# PRIVACY POLICY - AURIGRAPH DLT PLATFORM

**Effective Date**: December 27, 2025
**Last Updated**: December 27, 2025
**Version**: 1.0.0

---

## 1. INTRODUCTION AND SCOPE

Aurigraph DLT ("**Company**," "**we**," "**us**," "**our**") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Aurigraph DLT Platform ("**Platform**"), including all related services, features, and content.

**This Privacy Policy applies ONLY to the Aurigraph DLT Platform** (blockchain services, transaction processing, smart contracts, wallet interactions, and API access). Use of our website is governed by the separate Website Privacy Policy available at `/docs/legal/PRIVACY_POLICY_WEBSITE.md`.

### Key Definitions

- **"Personal Data"**: Any information relating to an identified or identifiable natural person
- **"Transaction Data"**: Blockchain transactions, smart contract interactions, and related metadata
- **"Wallet Information"**: Cryptographic keys, addresses, balances, and transaction history
- **"User Account"**: Registration and authentication credentials for Platform access
- **"Processed Data"**: Information we process, store, or analyze on your behalf

---

## 2. INFORMATION WE COLLECT

### 2.1 User Account Information

When you register for the Aurigraph DLT Platform, we collect:

- **Authentication Data**: Email address, username, password hash, phone number (optional)
- **Identity Information**: Full name, company name, job title, industry classification
- **Contact Information**: Mailing address, telephone number (optional)
- **Business Information**: Wallet addresses you manage, organizational affiliation

### 2.2 Transaction and Blockchain Data

**Public Blockchain Data** (Immutable and Transparent):
- All blockchain transactions, including:
  - Transaction hash and timestamp
  - Sender and receiver wallet addresses
  - Transaction amounts and token transfers
  - Smart contract deployment and execution
  - Transaction status and finality confirmation
- **NOTE**: This data is **PUBLIC** and immutable once recorded on the blockchain. We do not collect this; it is inherent to blockchain technology.

**Transaction Metadata** (Our Processing):
- Time of transaction initiation
- Transaction source (API, web interface, mobile app)
- Gas/fee information
- Execution status and logs
- Associated smart contract interactions

### 2.3 Wallet and Account Information

- Wallet addresses associated with your account
- Wallet balance snapshots and transaction history
- Smart contracts you deploy or interact with
- Token holdings and transfers
- Staking information and rewards history
- Multi-signature wallet configurations

### 2.4 Technical Information

When you access the Platform, we automatically collect:

- **Device Information**: Device type, operating system, browser/client version, unique identifiers
- **Access Information**: IP address, connection type, ISP, geolocation (approximate, based on IP)
- **Usage Information**: Pages visited, features used, time spent, interaction patterns
- **Performance Data**: Transaction processing times, API response times, error logs
- **Security Data**: Login attempts, authentication methods, security token usage

### 2.5 Communication Data

- Email communications and support tickets
- In-app messages and notifications
- API usage logs and interactions
- Two-factor authentication codes (stored temporarily)
- Webhook delivery logs (for smart contract integrations)

### 2.6 Derived and Analyzed Data

- **Behavioral Analytics**: Transaction patterns, peak usage times, feature preferences
- **Risk Scores**: Fraud detection signals, suspicious activity flags
- **Performance Metrics**: Transaction success rates, confirmation times
- **Aggregated Statistics**: Anonymized usage patterns (not linked to individuals)

---

## 3. LEGAL BASIS FOR PROCESSING

We process your data under the following legal bases:

### 3.1 Performance of Contract
- Executing transactions and smart contracts as requested
- Providing wallet management and account services
- Confirming transaction finality and status
- **Legal Basis**: Article 6(1)(b) GDPR; Contract performance

### 3.2 Legitimate Interests
- Detecting and preventing fraud and financial crime
- Improving Platform security and reliability
- Analyzing usage patterns to optimize services
- Investigating technical issues and disputes
- **Legal Basis**: Article 6(1)(f) GDPR; Legitimate interests

### 3.3 Legal Compliance
- Complying with anti-money laundering (AML) and know-your-customer (KYC) requirements
- Responding to legal process and law enforcement requests
- Maintaining transaction records for regulatory compliance
- Reporting to relevant financial authorities
- **Legal Basis**: Article 6(1)(c) GDPR; Legal obligations

### 3.4 Consent
- Marketing communications and newsletters
- Advanced analytics and profiling (optional)
- Biometric authentication (if provided)
- **Legal Basis**: Article 6(1)(a) GDPR; Your explicit consent

---

## 4. HOW WE USE YOUR INFORMATION

### 4.1 Core Service Operations
- Registering and managing your user account
- Processing, confirming, and recording blockchain transactions
- Executing smart contracts as deployed
- Providing real-time transaction status and confirmation
- Calculating gas fees and transaction costs
- Maintaining wallet security and implementing access controls

### 4.2 Security and Fraud Prevention
- Detecting unauthorized access attempts and suspicious activities
- Implementing multi-factor authentication (MFA)
- Monitoring for unusual transaction patterns
- Preventing money laundering and terrorist financing
- Responding to security incidents and breaches
- Verifying user identity for account recovery

### 4.3 Regulatory Compliance
- Meeting anti-money laundering (AML) requirements
- Performing know-your-customer (KYC) verification
- Responding to law enforcement requests and legal process
- Maintaining audit trails for compliance reporting
- Screening users against sanctions lists
- Reporting suspicious activities to authorities

### 4.4 Service Improvement
- Analyzing transaction patterns to improve platform performance
- Identifying and fixing technical issues
- Optimizing smart contract execution efficiency
- Enhancing user experience and interface design
- Conducting A/B testing of platform features
- Training AI models for fraud detection

### 4.5 Communications
- Sending transactional emails (confirmations, alerts, notifications)
- Notifying you of security incidents or account changes
- Providing customer support and responding to inquiries
- Sending service updates and maintenance notifications
- Marketing communications (only with your explicit consent)

### 4.6 Legal and Dispute Resolution
- Enforcing our Terms and Conditions
- Defending legal claims and disputes
- Complying with court orders and subpoenas
- Protecting the rights, property, and safety of the Company, users, and public

---

## 5. HOW WE PROTECT YOUR DATA

### 5.1 Quantum-Resistant Cryptography

Aurigraph DLT implements **NIST Level 5 quantum-resistant cryptography** to protect your data against current and future threats, including quantum computing:

- **CRYSTALS-Dilithium**: Post-quantum digital signatures for transaction verification
  - Key Size: 2,592 bytes (public), 4,896 bytes (private)
  - Signature Size: 3,309 bytes
  - Provides long-term signature validity

- **CRYSTALS-Kyber**: Module-Lattice-Based Key Encapsulation for encryption
  - Key Size: 1,568 bytes (public), 3,168 bytes (private)
  - Ciphertext Size: 1,568 bytes
  - Resistant to polynomial-time quantum algorithms

### 5.2 Transport Security
- **TLS 1.3**: End-to-end encryption for all data in transit
- **HTTP/2**: Secure multiplexing of API requests
- **Certificate Pinning**: Additional verification layer for API communications
- **Perfect Forward Secrecy**: Session keys cannot be compromised if private keys are disclosed

### 5.3 Data at Rest
- **AES-256 Encryption**: Encryption of sensitive data in storage
- **Hardware Security Modules (HSM)**: Protection of signing keys in production
- **Database Encryption**: PostgreSQL encryption at rest
- **Key Derivation**: PBKDF2 with SHA-256 for password security

### 5.4 Access Controls
- **Role-Based Access Control (RBAC)**: Limiting data access by job function
- **Multi-Factor Authentication (MFA)**: Required for all account operations
- **Principle of Least Privilege**: Employees access only necessary data
- **Activity Logging**: All data access recorded and auditable

### 5.5 Infrastructure Security
- **DDoS Protection**: Multi-layer defense against distributed attacks
- **Web Application Firewall (WAF)**: Protection against common web exploits
- **Intrusion Detection**: Real-time monitoring for unauthorized access
- **Regular Security Audits**: Third-party penetration testing quarterly
- **Vulnerability Management**: Continuous scanning and patching

---

## 6. DATA RETENTION

### 6.1 Transaction Data

**Blockchain Transaction Records**:
- **Retention Period**: Permanent (10+ years minimum)
- **Reason**: Immutable blockchain records cannot be modified or deleted
- **Access**: Available on public blockchain indefinitely
- **Policy**: We archive full transaction history in cold storage quarterly

**Transaction Metadata** (API logs, execution data):
- **Retention Period**: 7 years (regulatory requirement)
- **Reason**: Compliance with financial regulations and audit requirements
- **Backup**: Quarterly backups maintained for recovery purposes
- **Deletion**: After 7 years, data deleted using cryptographic erasure

### 6.2 User Account Data

**Active Accounts**:
- **Retention Period**: For the duration of your account
- **Policy**: Data retained while account remains active
- **Update**: You can update account information at any time

**Deleted Accounts**:
- **Grace Period**: 30 days (for account recovery)
- **Permanent Deletion**: After 30 days, all account data permanently deleted
- **Exception**: Transaction records retained per Section 6.1
- **Method**: Cryptographic deletion using secure key destruction

### 6.3 Wallet and Custody Data

**Wallet Information**:
- **Retention Period**: Indefinite (required to access your assets)
- **Policy**: Wallet addresses and balance information retained for account access
- **Note**: You control private keys; we do not retain them
- **Recovery**: If private keys lost, no data recovery possible

**Staking and Rewards Data**:
- **Retention Period**: 10 years minimum
- **Reason**: Tax and regulatory reporting requirements
- **Access**: Available for tax documentation downloads

### 6.4 Communications and Support

**Support Tickets and Communications**:
- **Retention Period**: 5 years
- **Reason**: Dispute resolution and service improvement
- **Access**: You can request copies of communications anytime
- **Deletion**: After 5 years, archived and permanently deleted

**Marketing Communications**:
- **Retention Period**: Duration of consent relationship
- **Policy**: Deleted immediately upon unsubscribe
- **Opt-Out**: You can unsubscribe from marketing emails at any time

### 6.5 Regulatory and Legal Data

**Compliance Records** (AML/KYC/sanctions screening):
- **Retention Period**: 7 years minimum (often 10+ years)
- **Reason**: Financial regulatory requirements
- **Access**: Only to compliance and legal teams
- **Destruction**: After retention period, destroyed using certified methods

**Legal and Litigation Data**:
- **Retention Period**: Until dispute/litigation resolved + 3 years
- **Reason**: Protecting legal rights and defending claims
- **Note**: Cannot be deleted while actively litigated

---

## 7. DATA SHARING AND DISCLOSURE

### 7.1 Third Parties We Share Data With

We may share your information with the following categories of recipients:

#### Service Providers
- **Cloud Infrastructure**: AWS, Azure, GCP for hosting and backup
- **Payment Processors**: For fiat on/off ramps (optional services)
- **Email Services**: For transactional emails and notifications
- **Analytics Providers**: For usage analytics (anonymized and aggregated)
- **Security Vendors**: For fraud detection and threat monitoring
- **Compliance Vendors**: For KYC/AML screening and sanctions checking

#### Legal and Regulatory
- **Law Enforcement**: In response to valid subpoenas, warrants, or court orders
- **Regulators**: Financial authorities and compliance agencies
- **Auditors**: External auditors for financial statement audits
- **Legal Counsel**: External attorneys for legal matters

#### Business Partners
- **Token Issuers**: Who deploy smart contracts on our Platform
- **Exchange Partners**: For custody and trading integrations
- **Financial Advisors**: With your explicit authorization
- **Insurance Providers**: For custody insurance (anonymized data only)

#### Other Users and the Public
- **Blockchain Network**: All transaction data recorded on public blockchain
- **Blockchain Explorers**: Third-party platforms that index blockchain data
- **API Consumers**: Users accessing data through our public APIs
- **Smart Contract Interactions**: Other users interacting with contracts you deploy

### 7.2 Data Sharing Agreements

All third-party data sharing is governed by:
- **Data Processing Agreements (DPA)**: Ensuring GDPR compliance
- **Confidentiality Agreements**: Protecting sensitive information
- **Limited Scope Contracts**: Defining exactly what data is shared and for what purposes
- **Audit Rights**: Allowing us to verify third-party compliance
- **Data Security Requirements**: Mandating encryption, access controls, and monitoring

### 7.3 International Data Transfers

We operate globally and may transfer data to countries outside your jurisdiction:

**Transfer Mechanisms** (where applicable):
- **Standard Contractual Clauses (SCCs)**: EU-approved transfer mechanisms
- **Privacy Shield or Equivalents**: Where available
- **Your Consent**: For transfers not otherwise authorized
- **Adequacy Decisions**: To countries with adequate data protection

**Data Transfer Disclosure**:
- Data may be transferred to servers in USA, Europe, and Asia
- You can request information about specific transfer locations
- All transfers include encryption both in transit and at rest

---

## 8. YOUR RIGHTS AND CHOICES

### 8.1 GDPR Rights (EU Residents)

If you are a resident of the European Union or European Economic Area, you have the following rights:

**Right to Access** (Article 15):
- You can request a copy of all Personal Data we hold about you
- Exercisable free of charge once per year
- Exceptions: Data of others, intellectual property, or confidential information
- Response Timeline: 30 days (extendable to 60 days for complex requests)

**Right to Rectification** (Article 16):
- You can correct inaccurate or incomplete data
- We will update within 30 days and notify third parties where practical
- You can submit corrections through your account settings
- Request Form: Submit via [privacy-requests@aurigraph.io](mailto:privacy-requests@aurigraph.io)

**Right to Erasure** (Article 17):
- You can request deletion of your Personal Data
- **Exceptions**:
  - Transaction records (immutable blockchain data cannot be deleted)
  - Data required by law or regulation (7-10 year retention)
  - Data needed for legitimate business interests
  - Data required for legal claims or defense
- Blockchain data cannot be deleted; only associated account data is erasable
- Non-blockchain Personal Data deleted within 30 days

**Right to Restrict Processing** (Article 18):
- You can request we limit how we process your data
- Processing continues only for storage or legal proceedings
- Restrictions persist until data accuracy confirmed or legal need expires
- We notify you before removing restrictions

**Right to Data Portability** (Article 20):
- You can request all your Personal Data in machine-readable format
- We will provide in CSV, JSON, or other structured format
- Transferable to other services without hindrance
- Exercisable at any time, free of charge
- Excludes data derived from other sources or requiring significant effort

**Right to Object** (Article 21):
- You can object to processing based on legitimate interests
- You can object to marketing and profiling
- We will stop processing unless compelling legitimate interests override
- Profiling for purposes of deciding automated decisions
- Response Timeline: 30 days

**Right to Not Be Subject to Automated Decision-Making** (Article 22):
- You can object to decisions based solely on automated processing
- This includes profiling and data analysis without human review
- We will provide manual review and explanation of automated decisions
- This right applies to decisions producing legal or similarly significant effects

**How to Exercise Your Rights**:
- Submit requests to: **privacy-requests@aurigraph.io**
- Include: Name, email, description of request, supporting documentation
- Verification: We will verify your identity before responding
- Response: Written response within 30 days (may extend to 60-90 days for complex requests)
- No Fee: Exercising your rights is free

### 8.2 CCPA Rights (California Residents)

If you are a resident of California, you have the following rights under the California Consumer Privacy Act (CCPA):

**Right to Know** (§1798.100):
- You have the right to request and know what Personal Information we collect
- Includes categories of information, sources, and business purposes
- You can request this information up to 2 times per 12-month period
- Free of charge for first request; subsequent requests may have reasonable fee

**Right to Delete** (§1798.105):
- You can request deletion of Personal Information collected from you
- **Exceptions**: We may retain data needed for legal, tax, or contractual purposes
- Blockchain transaction data cannot be deleted as it is immutable
- We will delete within 45 days and notify third parties

**Right to Opt-Out** (§1798.120):
- You can opt out of the sale or sharing of your Personal Information
- We do not currently sell consumer Personal Information
- You can submit requests through: **ccpa-requests@aurigraph.io**

**Right to Correct** (§1798.100):
- You can request corrections to inaccurate Personal Information
- We will correct within 45 days and notify affected third parties
- You can manage corrections in account settings

**Right to Limit Use and Disclosure** (§1798.115):
- You can limit use to necessary purposes
- Includes limiting use of sensitive Personal Information
- We will honor requests within 45 days except where necessary for contracted services

**Right to Non-Discrimination** (§1798.120):
- We will not discriminate against you for exercising CCPA rights
- No denial of service, different pricing, or different quality for exercising rights
- We may offer financial incentives for data collection (with clear disclosure)

**Right to Appeal** (§1798.150):
- You can appeal our decision to deny a CCPA request
- Submit appeal requests to: **privacy-appeals@aurigraph.io**
- We will respond within 45 days

**California Consumer Verifiable Requests**:
- Email: **ccpa-requests@aurigraph.io**
- Mail: Aurigraph DLT, Legal Department, [Company Address]
- Toll-Free Phone: [1-800-AURIGRAPH]
- Response Timeline: 45 days (may extend 45 days with notice)

### 8.3 Other Jurisdiction Rights

**US State Laws** (NY, PA, VA, etc.):
- Your state may have similar privacy laws
- Contact us for state-specific rights documentation
- We respect privacy laws in all US jurisdictions

**Brazil (LGPD)** (Lei Geral de Proteção de Dados):
- You have rights to access, correct, and delete your data
- You can request portability and opt-out of processing
- Contact: **privacy-requests@aurigraph.io** for LGPD requests

**Other Jurisdictions**:
- We respect privacy laws in all countries we serve
- Contact our Privacy Team for jurisdiction-specific rights

### 8.4 Exercising Your Rights: Step-by-Step

1. **Identify Your Right**: Review the rights section above for your jurisdiction
2. **Prepare Your Request**: Include:
   - Full name and email address
   - Description of your request (which right you're exercising)
   - Specific data or categories you're requesting
   - Supporting documentation (proof of residency, ID copy, etc.)
3. **Submit Your Request**:
   - Email: **privacy-requests@aurigraph.io**
   - Subject: "[JURISDICTION] Privacy Request - [Type]"
   - Example: "GDPR Privacy Request - Right to Access"
4. **We Will Verify**: We will confirm your identity and residence
5. **We Will Respond**:
   - Timeframe: 30-45 days depending on jurisdiction
   - Format: Written response with requested data or explanation
   - Appeal: You can appeal if request is denied or incomplete
6. **Appeal Process**:
   - If denied, email: **privacy-appeals@aurigraph.io**
   - Include original request, our response, and explanation
   - Response: Within 45 days

---

## 9. SECURITY INCIDENTS AND BREACH NOTIFICATION

### 9.1 Our Commitment to Security

We implement reasonable security measures to protect your Personal Data. However, no security system is impenetrable. We maintain:
- Encryption for data in transit and at rest
- Access controls and authentication mechanisms
- Regular security assessments and penetration testing
- Incident response and recovery procedures

### 9.2 Breach Notification

If we discover a security incident involving your Personal Data, we will:

**Notification Timeline**:
- **Without Unreasonable Delay**: We will investigate within 24 hours
- **To You**: Within 72 hours of discovering the breach (GDPR requirement)
- **To Authorities**: Within 72 hours where required by law
- **Public Notice**: For breaches affecting more than 5% of users

**Notification Content**:
- Nature of the Personal Data involved
- Categories and approximate number of affected individuals
- Likely consequences of the breach
- Measures we've taken or will take to address the breach
- Contact information for additional information
- Recommendations to protect yourself (change passwords, monitor accounts)

**Notification Methods**:
- Email to your account email address (primary method)
- SMS notification for high-risk breaches
- Public notice on our website and platform
- Press release for breaches affecting many users

### 9.3 Your Rights in Case of Breach

You have the right to:
- Free credit monitoring (for breaches involving payment information)
- Legal action against the Company
- Report the breach to your data protection authority
- Claim compensation for damages suffered

---

## 10. AUTOMATED DECISION-MAKING AND PROFILING

### 10.1 Use of Automated Decisions

We use automated decision-making in the following scenarios:

**Fraud Detection**:
- Automated analysis of transaction patterns to detect suspicious activities
- Machine learning models trained on historical fraud data
- Real-time scoring of transaction risk
- Automatic flagging of transactions exceeding risk thresholds
- **Your Rights**: You can request human review of automated fraud decisions

**Account Risk Assessment**:
- Automated analysis of login patterns, locations, and device changes
- Velocity checks for transaction frequency and amounts
- Sanctions screening against international watchlists
- **Your Rights**: You can challenge risk scores and request re-evaluation

**Performance Optimization**:
- Automated analysis of transaction patterns to improve platform efficiency
- Aggregated data analysis (not individual profiling)
- Machine learning models for consensus optimization
- **Your Rights**: This is non-profiling aggregated analysis; no individual rights apply

### 10.2 Profiling and Automated Decision-Making Rights

If you are subject to automated decision-making with legal or similarly significant effects:

**Your Right to Explanation**:
- We will explain the logic and significance of the decision
- Provide information about the data used
- Disclose the consequences of the decision
- Timeframe: Within 30 days of request

**Your Right to Human Review**:
- You can request a human review of automated decisions
- A human decision-maker will reconsider the decision
- You can provide additional information or context
- Timeframe: Human review completed within 15 days

**Your Right to Contest**:
- You can contest automated decisions that significantly affect you
- Submit contest request to: **decisions-appeals@aurigraph.io**
- Include your account ID and decision details
- We will provide written explanation or override decision

**Opting Out of Profiling**:
- Some profiling may be optional; you can opt out in account settings
- Opting out may affect service quality or availability (we'll disclose)
- Some profiling (fraud detection) is mandatory for platform security

---

## 11. CHILDREN AND MINORS

### 11.1 Age Restrictions

**Minimum Age**: You must be at least 18 years old to use the Aurigraph DLT Platform.

We do not knowingly collect or maintain Personal Data from children under 18. If we learn that we have collected Personal Data from a child under 18, we will:
- Immediately delete the data
- Notify the child's parent/guardian
- Take steps to prevent further collection

### 11.2 Parental Consent

If you are a parent or guardian and believe your child has provided Personal Data to us:
- Contact us immediately at **privacy-requests@aurigraph.io**
- Provide proof of guardianship and child's account details
- We will delete the child's account and data promptly

### 11.3 Minors in Some Jurisdictions

Some jurisdictions define "minors" as under 21 or other ages. We comply with the highest age threshold in any jurisdiction where we operate (currently 18 minimum).

---

## 12. CRYPTOCURRENCY AND BLOCKCHAIN CONSIDERATIONS

### 12.1 Blockchain Transparency

**Important**: Blockchain data is **public and permanent**.

All transactions on the Aurigraph DLT blockchain are:
- **Public**: Visible to everyone on the network and via blockchain explorers
- **Immutable**: Cannot be modified, deleted, or hidden
- **Permanent**: Recorded indefinitely (10+ years minimum, likely forever)
- **Searchable**: Indexed by third-party blockchain explorers
- **Linkable**: Your wallet address can be linked to all your transactions

**Your Wallet Address as Personal Data**:
- Your wallet address may constitute Personal Data if it can identify you
- You can use multiple anonymous wallet addresses to reduce linkability
- We respect wallet privacy; we do not publish your real name with addresses
- However, third-party analysis might link wallet addresses to identity

### 12.2 Transaction Privacy

**What's Private**:
- The purpose of your transactions (not recorded on blockchain)
- Your name and personal information (unless you disclose)
- Your identity (unless you voluntary provide it)

**What's Public**:
- Wallet addresses (sender and receiver)
- Transaction amounts and token transfers
- Transaction timestamps
- Gas fees and execution data
- Smart contract code and interactions
- All transaction history (complete audit trail)

### 12.3 De-anonymization Risks

Be aware that:
- Blockchain analysis firms can de-anonymize wallet addresses
- Law enforcement can subpoena transaction records
- Your wallet can be linked to exchanges and tracked
- Tax authorities can analyze blockchain data
- Pattern analysis might reveal your identity

**Risk Mitigation**:
- Use separate wallet addresses for different purposes
- Mix coins or use privacy coins (if supported)
- Avoid linking wallets to identified accounts
- Be cautious about sharing wallet addresses publicly

### 12.4 Staking and Rewards Privacy

Your staking information is:
- **Public**: Visible on the blockchain
- **Linked**: Associated with your wallet address
- **Trackable**: Can be followed across transactions
- **Reportable**: Required for tax compliance in most jurisdictions

---

## 13. UPDATES TO THIS PRIVACY POLICY

### 13.1 Policy Changes

We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or other factors. We will:

**For Material Changes**:
- Provide at least 30 days' notice before changes take effect
- Email notification to account holders
- Prominent notice on the platform
- Request your consent for significant privacy reductions (where required)

**For Minor Changes**:
- Post updated policy on this page
- Update the "Last Updated" date
- Changes take effect immediately

**Your Options**:
- Accept the updated policy (by continuing to use the Platform)
- Reject the policy and delete your account
- If you reject, we will delete your Personal Data per Section 6.2

### 13.2 Notification Method

We will notify you of policy changes via:
- Email to your account email address
- In-app notification on the Platform
- Notice on our website homepage
- Social media announcement (for major changes)

### 13.3 Your Continued Use

Your continued use of the Platform after policy changes constitutes acceptance of the updated Privacy Policy. If you do not agree, you should delete your account and cease using the Platform.

---

## 14. CONTACT INFORMATION

### 14.1 Privacy Team

For privacy questions, concerns, or requests:

**Email**: [privacy@aurigraph.io](mailto:privacy@aurigraph.io)
**Mailing Address**:
Aurigraph DLT
Legal Department - Privacy Team
[Company Address]
[City, State ZIP]

**Phone**: [+1-800-AURIGRAPH] (if available)
**Response Time**: We will respond to privacy inquiries within 5 business days

### 14.2 Data Protection Officer (DPO)

For EU-specific privacy matters:

**Email**: [dpo@aurigraph.io](mailto:dpo@aurigraph.io)
**Availability**: Available during EU business hours
**Consultation**: You can request a private DPO consultation

### 14.3 Regulatory Authorities

If you have concerns about our privacy practices, you can contact your local data protection authority:

**EU/EEA**: Your national Data Protection Authority
**California**: California Attorney General - Privacy Bureau
**Other US States**: State Attorney General or Privacy Commissioner
**International**: Your local data protection regulator

---

## 15. ADDITIONAL PROVISIONS

### 15.1 Data Protection Impact Assessment (DPIA)

For high-risk processing activities, we conduct Data Protection Impact Assessments including:
- Assessment of processing necessity and proportionality
- Risk evaluation and mitigation strategies
- Privacy by design and default implementation
- Regular monitoring and testing

You can request a summary of our DPIA for specific processing activities.

### 15.2 Accountability and Governance

We maintain:
- Documented processing records and data inventories
- Privacy policies and procedures
- Employee privacy training and certifications
- Third-party audit reports
- Incident response procedures

You can request documentation of our accountability practices.

### 15.3 Processor Agreements

All data processors are bound by:
- Data Processing Agreements incorporating GDPR/CCPA terms
- Confidentiality obligations
- Security requirements and audit rights
- Liability and indemnification clauses
- Sub-processor approval requirements

### 15.4 Legitimate Interests Balancing

For processing based on legitimate interests, we have documented:
- The specific legitimate interest pursued
- Why processing is necessary
- Why your privacy interests do not override
- How we balance interests and minimize impact

You can request a copy of our balancing assessments for specific processing.

---

## 16. COMPLIANCE CERTIFICATIONS

We maintain the following security and privacy certifications:

- **SOC 2 Type II**: Security and availability controls
- **ISO 27001**: Information security management
- **ISO 27701**: Privacy information management
- **Quantum-Safe Cryptography**: NIST Level 5 compliance
- **Regular Audits**: Third-party security assessments quarterly

Certification copies available upon request.

---

## 17. DISPUTE RESOLUTION

Disputes regarding this Privacy Policy shall be resolved as follows:

1. **Good Faith Negotiation** (30 days): Attempt to resolve through discussion
2. **Mediation** (45 days): Use neutral third-party mediator
3. **Arbitration or Litigation**: Per Terms and Conditions

This Privacy Policy is governed by [Applicable Law - typically your jurisdiction].

---

## 18. ACKNOWLEDGMENT

By accessing and using the Aurigraph DLT Platform, you acknowledge that you have:
- Read this Privacy Policy
- Understand how your data is collected and used
- Consent to the practices described herein
- Accept the inherent risks of blockchain technology

---

**Questions? Contact us at [privacy@aurigraph.io](mailto:privacy@aurigraph.io)**

**Last Updated**: December 27, 2025
**Version**: 1.0.0
