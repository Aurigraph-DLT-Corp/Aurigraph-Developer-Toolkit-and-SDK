import React from 'react';
import { Link } from 'react-router-dom';
import AurexLogo from '@/components/ui/AurexLogo';

const PrivacyPolicy: React.FC = () => {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
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
              <li><a href="#section-1" className="text-green-600 hover:text-green-700">1. Introduction</a></li>
              <li><a href="#section-2" className="text-green-600 hover:text-green-700">2. Information We Collect</a></li>
              <li><a href="#section-3" className="text-green-600 hover:text-green-700">3. How We Use Your Information</a></li>
              <li><a href="#section-4" className="text-green-600 hover:text-green-700">4. Sustainability Data Handling</a></li>
              <li><a href="#section-5" className="text-green-600 hover:text-green-700">5. Data Sharing and Disclosure</a></li>
              <li><a href="#section-6" className="text-green-600 hover:text-green-700">6. Cookies and Analytics</a></li>
              <li><a href="#section-7" className="text-green-600 hover:text-green-700">7. Data Security and Storage</a></li>
              <li><a href="#section-8" className="text-green-600 hover:text-green-700">8. Your Rights and Choices</a></li>
              <li><a href="#section-9" className="text-green-600 hover:text-green-700">9. GDPR Compliance</a></li>
              <li><a href="#section-10" className="text-green-600 hover:text-green-700">10. Email Communications</a></li>
              <li><a href="#section-11" className="text-green-600 hover:text-green-700">11. Children's Privacy</a></li>
              <li><a href="#section-12" className="text-green-600 hover:text-green-700">12. International Data Transfers</a></li>
              <li><a href="#section-13" className="text-green-600 hover:text-green-700">13. Changes to This Policy</a></li>
              <li><a href="#section-14" className="text-green-600 hover:text-green-700">14. Contact Information</a></li>
            </ol>
          </div>

          {/* Content Sections */}
          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section id="section-1" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Aurex, a comprehensive sustainability platform operated by Aurigraph DLT Corp ("we," "us," or "our"). 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                platform, including our web applications, mobile applications, and related services (collectively, the "Service").
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Aurex provides advanced sustainability solutions including ESG assessment, water management (HydroPulse), 
                forest monitoring (SylvaGraph), and carbon credit trading (CarbonTrace). We are committed to protecting 
                your privacy and ensuring the security of your personal and sustainability data.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. 
                If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">We may collect the following personal information:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Name, email address, phone number, and business contact information</li>
                <li>Company name, job title, and professional details</li>
                <li>Account credentials and authentication information</li>
                <li>Payment and billing information for subscription services</li>
                <li>Communication preferences and support inquiries</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Sustainability and Agricultural Data</h3>
              <p className="text-gray-700 leading-relaxed mb-4">Our platform collects specialized data including:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Farm location, size, and agricultural practices information</li>
                <li>Water usage data and irrigation patterns (HydroPulse)</li>
                <li>Forest monitoring data and satellite imagery (SylvaGraph)</li>
                <li>Carbon sequestration measurements and credit transactions (CarbonTrace)</li>
                <li>ESG assessment data and sustainability metrics</li>
                <li>Environmental impact measurements and reporting data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Device information, IP address, and browser type</li>
                <li>Usage data, including pages visited and features used</li>
                <li>Log files and system performance data</li>
                <li>Location data when using mobile applications</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use collected information for the following purposes:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Service Provision</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Providing and maintaining our sustainability platform services</li>
                <li>Processing carbon credit transactions and sustainability assessments</li>
                <li>Generating reports and analytics for sustainability management</li>
                <li>Facilitating communication between farmers, organizations, and stakeholders</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Platform Improvement</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Analyzing usage patterns to improve platform functionality</li>
                <li>Developing new features and sustainability solutions</li>
                <li>Conducting research on agricultural and environmental practices</li>
                <li>Ensuring platform security and preventing fraud</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Communication and Support</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Responding to customer inquiries and providing technical support</li>
                <li>Sending important platform updates and security notifications</li>
                <li>Providing educational content about sustainability practices</li>
                <li>Marketing communications (with your consent)</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Sustainability Data Handling</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Given the specialized nature of our sustainability platform, we handle environmental and agricultural data with particular care:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Carbon Credit Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>All carbon credit transactions are recorded on secure blockchain infrastructure</li>
                <li>Data integrity is maintained through cryptographic verification</li>
                <li>Transaction history is immutable and auditable for compliance purposes</li>
                <li>Personal identifiers are separated from transaction data where possible</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Farmer and Agricultural Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Farm location data is anonymized for research and reporting purposes</li>
                <li>Individual farmer information is kept confidential and not shared without consent</li>
                <li>Aggregated data may be used for industry research and sustainability reporting</li>
                <li>Farmers retain ownership rights to their agricultural data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Environmental Monitoring Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Satellite imagery and IoT sensor data is processed for environmental insights</li>
                <li>Data is used to generate sustainability reports and compliance documentation</li>
                <li>Environmental data may be shared with regulatory bodies as required by law</li>
                <li>Data accuracy and verification procedures are maintained for all measurements</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We may share your information in the following circumstances:</p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Service Providers</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Third-party vendors who assist in platform operations and maintenance</li>
                <li>Cloud infrastructure providers for data storage and processing</li>
                <li>Payment processors for subscription and transaction services</li>
                <li>Analytics providers for platform improvement and optimization</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Legal Requirements</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>When required by law, regulation, or legal process</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>In connection with regulatory compliance and auditing requirements</li>
                <li>For carbon credit verification and environmental reporting obligations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Business Transfers</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred
                as part of the business transaction, subject to the same privacy protections.
              </p>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies and Analytics</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Cookies Usage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Maintain user sessions and authentication</li>
                <li>Remember user preferences and settings</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and recommendations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Analytics Services</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use analytics services to understand how our platform is used and to improve our services.
                These services may collect information about your device, browser, and usage patterns.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Cookie Management</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can control cookie settings through your browser preferences. However, disabling certain
                cookies may affect platform functionality and your user experience.
              </p>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security and Storage</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Security Measures</h3>
              <p className="text-gray-700 leading-relaxed mb-4">We implement comprehensive security measures including:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>256-bit encryption for data transmission and storage</li>
                <li>Multi-factor authentication for user accounts</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Blockchain technology for immutable data records</li>
                <li>Access controls and employee security training</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Data Storage</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your data is stored on secure cloud infrastructure with redundancy and backup systems.
                We retain data only as long as necessary for the purposes outlined in this policy or as required by law.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Data Breach Response</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                In the event of a data breach, we will notify affected users and relevant authorities within
                72 hours as required by applicable data protection laws.
              </p>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the following rights regarding your personal information:</p>

              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Access:</strong> Request access to your personal information we hold</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service provider</li>
                <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for processing where consent is the legal basis</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                To exercise these rights, please contact us using the information provided in Section 14.
                We will respond to your request within 30 days.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. GDPR Compliance</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                For users in the European Union, we comply with the General Data Protection Regulation (GDPR).
                Our legal basis for processing includes:
              </p>

              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li><strong>Contract:</strong> Processing necessary for service provision</li>
                <li><strong>Legitimate Interest:</strong> Platform improvement and security</li>
                <li><strong>Consent:</strong> Marketing communications and optional features</li>
                <li><strong>Legal Obligation:</strong> Compliance with environmental regulations</li>
              </ul>

              <p className="text-gray-700 leading-relaxed mb-4">
                You have the right to lodge a complaint with your local data protection authority if you
                believe we have not handled your personal information appropriately.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Email Communications</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Types of Communications</h3>
              <p className="text-gray-700 leading-relaxed mb-4">We may send you the following types of emails:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Transactional emails related to your account and platform usage</li>
                <li>Security notifications and important platform updates</li>
                <li>Sustainability reports and carbon credit transaction confirmations</li>
                <li>Educational content about sustainable practices (with consent)</li>
                <li>Marketing communications about new features and services (with consent)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Unsubscribe Options</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You can unsubscribe from marketing emails at any time by clicking the unsubscribe link
                in the email or by contacting us directly. Note that you cannot opt out of essential
                transactional and security communications.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Service is not intended for children under 18 years of age. We do not knowingly collect
                personal information from children under 18. If you are a parent or guardian and believe
                your child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your information may be transferred to and processed in countries other than your country of residence.
                We ensure appropriate safeguards are in place for international transfers, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-1">
                <li>Standard contractual clauses approved by the European Commission</li>
                <li>Adequacy decisions for countries with equivalent data protection laws</li>
                <li>Certification schemes and codes of conduct</li>
                <li>Binding corporate rules for intra-group transfers</li>
              </ul>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technology, legal requirements, or other factors. We will notify you of any material changes
                by posting the updated policy on our website and, where appropriate, by email.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your continued use of our Service after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Section 14 */}
            <section id="section-14" className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
                please contact us:
              </p>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Aurigraph DLT Corp</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Privacy Officer:</strong> Chief Privacy Officer</p>
                  <p><strong>Email:</strong> <a href="mailto:privacy@aurigraph.com" className="text-green-600 hover:text-green-700">privacy@aurigraph.com</a></p>
                  <p><strong>General Contact:</strong> <a href="mailto:contact@aurigraph.com" className="text-green-600 hover:text-green-700">contact@aurigraph.com</a></p>
                  <p><strong>Address:</strong> 4005 36th St., Mount Rainier, MD 20712, USA</p>
                  <p><strong>Phone:</strong> <a href="tel:+919945103337" className="text-green-600 hover:text-green-700">+91 9945103337</a></p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed mt-4">
                We are committed to resolving any privacy concerns promptly and will respond to your inquiry within 30 days.
              </p>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500 mb-4">
                This Privacy Policy is effective as of January 26, 2025, and applies to all users of the Aurex platform.
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <Link to="/terms" className="text-green-600 hover:text-green-700">Terms of Service</Link>
                <span className="text-gray-300">|</span>
                <Link to="/" className="text-green-600 hover:text-green-700">Back to Home</Link>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => window.print()}
                  className="text-green-600 hover:text-green-700"
                >
                  Print Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
