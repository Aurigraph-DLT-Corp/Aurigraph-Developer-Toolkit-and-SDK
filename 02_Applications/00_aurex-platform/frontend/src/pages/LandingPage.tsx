import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

// Components - will be created in next steps
import HeroSection from '../components/sections/HeroSection';
import OurMissionSection from '../components/sections/OurMissionSection';
import ProductShowcase from '../components/sections/ProductShowcase';
import BenefitsSection from '../components/sections/BenefitsSection';
import HowCanWeHelpSection from '../components/sections/HowCanWeHelpSection';
import VoicesFromTheFieldSection from '../components/sections/VoicesFromTheFieldSection';
import TechnologySection from '../components/sections/TechnologySection';
import Footer from '../components/Footer';
import SEOHead, { createHomePageSchema, createFAQSchema } from '../components/SEOHead';

// Hooks
import { useScrollTo } from '../hooks/useScrollTo';

// Utils
import { trackPageView } from '../utils/analytics';
import { pageMetaConfig, generatePageStructuredData } from '../utils/sitemap';

interface LandingPageProps {
  scrollTo?: string;
}

const LandingPage: React.FC<LandingPageProps> = ({ scrollTo }) => {
  useScrollTo(scrollTo);

  useEffect(() => {
    // Track page view
    trackPageView('Landing Page');
  }, []);

  // Define FAQ data for schema
  const faqData = [
    {
      question: 'What is DMRV and how does Aurex help?',
      answer: 'DMRV stands for Digital Monitoring, Reporting, and Verification. Aurex provides a comprehensive DMRV platform that helps organizations monitor their environmental impact, generate compliant reports, and verify their ESG data using AI-powered technology.'
    },
    {
      question: 'Which industries can benefit from Aurex Platform?',
      answer: 'Aurex serves manufacturing, agriculture, mining, renewable energy, and forestry industries. Our platform is designed to help any organization that needs to monitor environmental impact and maintain ESG compliance.'
    },
    {
      question: 'How does Aurex ensure data accuracy and compliance?',
      answer: 'We use satellite imagery, IoT sensors, AI analytics, and blockchain verification to ensure data accuracy. Our platform is designed to meet international ESG reporting standards and compliance requirements.'
    },
    {
      question: 'Can I integrate Aurex with existing systems?',
      answer: 'Yes, Aurex offers comprehensive API integration capabilities and supports common data formats. Our platform can seamlessly integrate with your existing ERP, sustainability management, and reporting systems.'
    },
    {
      question: 'What kind of support does Aurex provide?',
      answer: 'We provide 24/7 technical support, dedicated account management, onboarding assistance, training programs, and ongoing consultation to help you maximize the value of our platform.'
    }
  ];

  // Generate structured data schemas
  const homeSchema = createHomePageSchema();
  const faqSchema = createFAQSchema(faqData);
  const pageSchema = generatePageStructuredData('home');

  // Combine all schemas
  const combinedSchema = {
    '@context': 'https://schema.org',
    '@graph': [homeSchema, faqSchema, pageSchema]
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Head - includes meta tags, structured data, and optimization */}
      <SEOHead
        title={pageMetaConfig.home.title}
        description={pageMetaConfig.home.description}
        keywords={pageMetaConfig.home.keywords}
        canonicalUrl="https://dev.aurigraph.io"
        schema={combinedSchema}
      />
      
      {/* Main Content */}
      <main className="overflow-hidden" role="main">
        {/* Hero Section - Primary landing content */}
        <motion.section
          id="hero"
          aria-label="Hero introduction to Aurex Platform"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <HeroSection />
        </motion.section>

        {/* Our Mission Section - Company mission and values */}
        <motion.section
          id="mission"
          aria-label="Aurex mission and environmental impact goals"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <OurMissionSection />
        </motion.section>

        {/* Product Showcase - Key products and solutions */}
        <motion.section
          id="products"
          aria-label="Aurex product suite and DMRV solutions"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <ProductShowcase />
        </motion.section>

        {/* Technology Section - Technical capabilities */}
        <motion.section
          id="technology"
          aria-label="Aurex technology stack and AI capabilities"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <TechnologySection />
        </motion.section>

        {/* Benefits Section - Value propositions */}
        <motion.section
          id="benefits"
          aria-label="Benefits and value of Aurex platform"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <BenefitsSection />
        </motion.section>

        {/* Contact and Support Section */}
        <motion.section
          id="contact"
          aria-label="Contact Aurex and get started"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <HowCanWeHelpSection />
        </motion.section>

        {/* Testimonials and Social Proof */}
        <motion.section
          id="testimonials"
          aria-label="Customer testimonials and success stories"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <VoicesFromTheFieldSection />
        </motion.section>







      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;

