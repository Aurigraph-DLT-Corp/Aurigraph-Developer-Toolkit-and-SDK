import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
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
// Hooks
import { useScrollTo } from '../hooks/useScrollTo';
// Utils
import { trackPageView } from '../utils/analytics';
const LandingPage = ({ scrollTo }) => {
    useScrollTo(scrollTo);
    useEffect(() => {
        // Track page view
        trackPageView('Landing Page');
        // Set page title
        document.title = 'Aurex Platform | ESG Reporting & Environmental Monitoring Software';
        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', 'Transform your ESG impact with Aurex\'s DMRV platform. Monitor water, forests, and carbon with AI-powered precision. Start your free trial today.');
        }
    }, []);
    return (_jsxs("div", { className: "min-h-screen bg-white", children: [_jsxs("main", { className: "overflow-hidden", children: [_jsx(motion.section, { id: "hero", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 }, children: _jsx(HeroSection, {}) }), _jsx(motion.section, { id: "mission", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true, margin: "-100px" }, children: _jsx(OurMissionSection, {}) }), _jsx(motion.section, { id: "products", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true, margin: "-100px" }, children: _jsx(ProductShowcase, {}) }), _jsx(motion.section, { id: "technology", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true, margin: "-100px" }, children: _jsx(TechnologySection, {}) }), _jsx(motion.section, { id: "benefits", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true, margin: "-100px" }, children: _jsx(BenefitsSection, {}) }), _jsx(motion.section, { id: "help", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true, margin: "-100px" }, children: _jsx(HowCanWeHelpSection, {}) }), _jsx(motion.section, { id: "testimonials", initial: { opacity: 0, y: 50 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true, margin: "-100px" }, children: _jsx(VoicesFromTheFieldSection, {}) })] }), _jsx(Footer, {})] }));
};
export default LandingPage;
