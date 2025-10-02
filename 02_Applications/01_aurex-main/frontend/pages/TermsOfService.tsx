import React from 'react';
import { Link } from 'react-router-dom';
import AurexLogo from '@/components/ui/AurexLogo';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <AurexLogo size="lg" variant="default" />
              <div>
                <div className="font-bold text-xl text-gray-900">Aurex</div>
                <div className="text-sm text-gray-600">
                  Sustainability Platform, by <span className="text-green-600 font-medium">Aurigraph</span>
                </div>
              </div>
            </Link>
            <Link 
              to="/" 
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 md:p-12">
          {/* Document Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <div className="text-gray-600">
              <p className="text-lg mb-2">Aurex Sustainability Platform</p>
              <p>by Aurigraph DLT Corp</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm"><strong>Last Updated:</strong> January 26, 2025</p>
                <p className="text-sm"><strong>Version:</strong> 1.0</p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <ol className="space-y-2 text-sm">
              <li><a href="#section-1" className="text-green-600 hover:text-green-700">1. Acceptance of Terms</a></li>
              <li><a href="#section-2" className="text-green-600 hover:text-green-700">2. Description of Service</a></li>
              <li><a href="#section-3" className="text-green-600 hover:text-green-700">3. User Accounts and Registration</a></li>
              <li><a href="#section-4" className="text-green-600 hover:text-green-700">4. User Responsibilities and Conduct</a></li>
              <li><a href="#section-5" className="text-green-600 hover:text-green-700">5. Intellectual Property Rights</a></li>
              <li><a href="#section-6" className="text-green-600 hover:text-green-700">6. Subscription Terms and Payment</a></li>
              <li><a href="#section-7" className="text-green-600 hover:text-green-700">7. Carbon Credit Transactions</a></li>
              <li><a href="#section-8" className="text-green-600 hover:text-green-700">8. Data Accuracy and Verification</a></li>
              <li><a href="#section-9" className="text-green-600 hover:text-green-700">9. Platform Availability and Maintenance</a></li>
              <li><a href="#section-10" className="text-green-600 hover:text-green-700">10. Limitation of Liability</a></li>
              <li><a href="#section-11" className="text-green-600 hover:text-green-700">11. Indemnification</a></li>
              <li><a href="#section-12" className="text-green-600 hover:text-green-700">12. Termination</a></li>
              <li><a href="#section-13" className="text-green-600 hover:text-green-700">13. Dispute Resolution</a></li>
              <li><a href="#section-14" className="text-green-600 hover:text-green-700">14. Governing Law</a></li>
              <li><a href="#section-15" className="text-green-600 hover:text-green-700">15. Changes to Terms</a></li>
              <li><a href="#section-16" className="text-green-600 hover:text-green-700">16. Contact Information</a></li>
            </ol>
          </div>

          {/* Content Sections */}
          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section id="section-1" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") 
                and Aurigraph DLT Corp ("Company," "we," "us," or "our") regarding your use of the Aurex sustainability 
                platform and related services (the "Service").
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. 
                If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                These Terms apply to all users of the Service, including farmers, organizations, enterprises, 
                and any other individuals or entities that access or use the platform.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Aurex is a comprehensive sustainability platform that provides the following services:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Platform Components</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Aurex Launchpad:</strong> ESG assessment and net-zero planning tools</li>
                <li><strong>Aurex HydroPulse:</strong> Advanced water management and AWD (Alternate Wetting and Drying) solutions</li>
                <li><strong>Aurex SylvaGraph:</strong> Drone-based forest monitoring and carbon sequestration tracking</li>
                <li><strong>Aurex CarbonTrace:</strong> Carbon credit trading and DMRV (Digital Monitoring, Reporting, and Verification) platform</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Service Features</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Sustainability data collection, analysis, and reporting</li>
                <li>Carbon credit generation, verification, and trading</li>
                <li>Environmental monitoring through satellite imagery and IoT sensors</li>
                <li>Blockchain-based transaction recording and verification</li>
                <li>AI-powered analytics and predictive modeling</li>
                <li>Compliance reporting and regulatory documentation</li>
              </ul>

              <p className="text-gray-700 leading-relaxed">
                The Service is designed to help organizations and individuals achieve their sustainability goals 
                while ensuring transparency, accuracy, and compliance with environmental regulations.
              </p>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features of the Service, you must create an account by providing accurate, 
                current, and complete information. You are responsible for maintaining the confidentiality of 
                your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Requirements</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and truthful information during registration</li>
                <li>You must maintain the security of your login credentials</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You are responsible for all activities conducted through your account</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Account Verification</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                For certain services, particularly carbon credit transactions, we may require additional 
                verification of your identity, business credentials, or agricultural operations. 
                Failure to provide required verification may limit your access to certain features.
              </p>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Responsibilities and Conduct</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Acceptable Use</h3>
              <p className="text-gray-700 leading-relaxed mb-4">You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Submit false, misleading, or inaccurate sustainability data</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Use the Service for any fraudulent or illegal activities</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Data Accuracy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You are responsible for ensuring the accuracy and completeness of all data you submit to the platform, 
                including but not limited to agricultural data, environmental measurements, and sustainability metrics. 
                Inaccurate data may affect carbon credit calculations and compliance reporting.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Compliance</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to comply with all applicable environmental regulations, carbon credit standards, 
                and sustainability reporting requirements in your jurisdiction. You are responsible for 
                understanding and adhering to relevant laws and regulations.
              </p>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Company Intellectual Property</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service and all content, features, and functionality are owned by Aurigraph DLT Corp and are
                protected by copyright, trademark, patent, and other intellectual property laws. This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Aurex platform software, algorithms, and source code</li>
                <li>User interface designs, graphics, and visual elements</li>
                <li>Proprietary methodologies for sustainability measurement and verification</li>
                <li>Blockchain infrastructure and smart contract implementations</li>
                <li>AI models and machine learning algorithms</li>
                <li>Documentation, reports, and analytical tools</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 User Content and Data</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of the data you submit to the platform. However, by using the Service,
                you grant us a limited, non-exclusive license to use, process, and analyze your data for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Providing the Service and generating reports</li>
                <li>Improving platform functionality and accuracy</li>
                <li>Aggregated research and industry analysis (anonymized)</li>
                <li>Compliance with regulatory requirements</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Trademark Usage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                "Aurex," "Aurigraph," and related trademarks are proprietary to Aurigraph DLT Corp.
                You may not use our trademarks without prior written consent.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Subscription Terms and Payment</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Subscription Plans</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service may be offered through various subscription plans with different features and pricing.
                Subscription details, including pricing and features, are available on our website and may be
                updated from time to time.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable unless otherwise specified</li>
                <li>You authorize us to charge your payment method for all applicable fees</li>
                <li>You are responsible for maintaining valid payment information</li>
                <li>Late payments may result in service suspension or termination</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Price Changes</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify subscription pricing with 30 days' notice.
                Price changes will take effect at the start of your next billing cycle.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.4 Cancellation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may cancel your subscription at any time through your account settings or by contacting support.
                Cancellation will take effect at the end of your current billing period.
                No refunds will be provided for partial billing periods.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Carbon Credit Transactions</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Carbon Credit Generation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Carbon credits generated through the platform are based on verified sustainability practices
                and environmental measurements. The calculation methodology follows established standards and
                is subject to third-party verification where required.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Transaction Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>All carbon credit transactions are recorded on blockchain infrastructure</li>
                <li>Transaction fees may apply for buying, selling, or transferring credits</li>
                <li>Credits are subject to verification and may be adjusted based on audits</li>
                <li>You are responsible for tax implications of carbon credit transactions</li>
                <li>Transactions are generally irreversible once confirmed on the blockchain</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Market Risks</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Carbon credit values may fluctuate based on market conditions, regulatory changes,
                and other factors. We do not guarantee any specific value or return on carbon credit investments.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.4 Compliance and Standards</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Carbon credits generated through our platform comply with relevant standards such as
                Verified Carbon Standard (VCS), Gold Standard, and other recognized certification bodies.
                Users are responsible for ensuring credits meet their specific compliance requirements.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Accuracy and Verification</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Data Verification Process</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We employ various verification methods including satellite imagery, IoT sensors,
                blockchain verification, and third-party audits to ensure data accuracy. However,
                the primary responsibility for data accuracy lies with the data provider.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Measurement Standards</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our platform uses internationally recognized measurement standards and methodologies
                for sustainability metrics. These may be updated periodically to reflect best practices
                and regulatory requirements.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Disclaimer</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                While we strive for accuracy, we cannot guarantee the absolute precision of all measurements
                and calculations. Users should conduct their own due diligence and verification for
                critical business decisions.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Platform Availability and Maintenance</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Service Availability</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We strive to maintain high service availability but cannot guarantee uninterrupted access.
                The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 Scheduled Maintenance</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We will provide reasonable notice for scheduled maintenance that may affect service availability.
                Emergency maintenance may be performed without prior notice.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 Service Updates</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update, modify, or discontinue features of the Service at any time.
                We will provide reasonable notice for significant changes that may affect your use of the Service.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>

              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AURIGRAPH DLT CORP SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Loss of data or information</li>
                <li>Business interruption or downtime</li>
                <li>Carbon credit value fluctuations</li>
                <li>Regulatory compliance issues</li>
                <li>Third-party claims or damages</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED
                THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>

              <p className="text-gray-700 leading-relaxed mb-4">
                SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES,
                SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless Aurigraph DLT Corp, its officers, directors,
                employees, and agents from and against any claims, damages, losses, costs, and expenses
                (including reasonable attorneys' fees) arising from or related to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Inaccurate or misleading data you provide</li>
                <li>Your carbon credit transactions</li>
                <li>Any third-party claims related to your use of the Service</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Termination</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Termination by You</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may terminate your account at any time by contacting us or using the account closure
                feature in your account settings. Termination will not relieve you of any obligations
                incurred prior to termination.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Termination by Us</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may suspend or terminate your account immediately if you violate these Terms,
                engage in fraudulent activities, or for any other reason at our sole discretion.
                We will provide reasonable notice when possible.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 Effect of Termination</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Upon termination, your right to use the Service will cease immediately.
                We may retain your data as required by law or for legitimate business purposes.
                Provisions that by their nature should survive termination will remain in effect.
              </p>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.1 Informal Resolution</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Before initiating formal dispute resolution, you agree to contact us to attempt
                to resolve the dispute informally. We will work in good faith to resolve any disputes.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.2 Binding Arbitration</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Any disputes that cannot be resolved informally shall be resolved through binding arbitration
                in accordance with the Commercial Arbitration Rules of the American Arbitration Association.
                The arbitration will be conducted in Maryland, USA.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">13.3 Class Action Waiver</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree that any arbitration or legal proceeding shall be conducted on an individual basis
                and not as part of a class action, collective action, or representative proceeding.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of Maryland,
                USA, without regard to its conflict of law principles. Any legal action or proceeding arising
                under these Terms will be brought exclusively in the federal or state courts located in Maryland.
              </p>
            </section>

            {/* Section 15 */}
            <section id="section-15" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right to modify these Terms at any time. We will notify users of material changes
                by posting the updated Terms on our website and, where appropriate, by email.
                Your continued use of the Service after any changes constitutes acceptance of the new Terms.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you do not agree to the modified Terms, you must stop using the Service and may terminate your account.
              </p>
            </section>

            {/* Section 16 */}
            <section id="section-16" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms or need to contact us regarding legal matters, please reach out:
              </p>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Aurigraph DLT Corp</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Legal Department:</strong> Chief Legal Officer</p>
                  <p><strong>Email:</strong> <a href="mailto:legal@aurigraph.com" className="text-green-600 hover:text-green-700">legal@aurigraph.com</a></p>
                  <p><strong>General Contact:</strong> <a href="mailto:contact@aurigraph.com" className="text-green-600 hover:text-green-700">contact@aurigraph.com</a></p>
                  <p><strong>Address:</strong> 4005 36th St., Mount Rainier, MD 20712, USA</p>
                  <p><strong>Phone:</strong> <a href="tel:+919945103337" className="text-green-600 hover:text-green-700">+91 9945103337</a></p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500 mb-4">
                These Terms of Service are effective as of January 26, 2025, and apply to all users of the Aurex platform.
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <Link to="/privacy" className="text-green-600 hover:text-green-700">Privacy Policy</Link>
                <span className="text-gray-300">|</span>
                <Link to="/" className="text-green-600 hover:text-green-700">Back to Home</Link>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => window.print()}
                  className="text-green-600 hover:text-green-700"
                >
                  Print Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
