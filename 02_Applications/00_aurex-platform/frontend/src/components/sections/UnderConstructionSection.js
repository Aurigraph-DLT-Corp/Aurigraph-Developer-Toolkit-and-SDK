import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
const UnderConstructionSection = ({ sectionName, id, className = "section-padding bg-gray-50" }) => {
    return (_jsx("section", { id: id, className: className, children: _jsx("div", { className: "max-w-4xl mx-auto container-padding", children: _jsxs(motion.div, { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true }, className: "text-center bg-white rounded-2xl p-12 shadow-sm border border-gray-100", children: [_jsx("div", { className: "w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(WrenchScrewdriverIcon, { className: "w-8 h-8 text-primary-600" }) }), _jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: sectionName }), _jsx("p", { className: "text-lg text-gray-600 mb-6", children: "This section is under construction and will be implemented according to PRD-501 specifications." }), _jsx("div", { className: "inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium", children: "Coming Soon" })] }) }) }));
};
export default UnderConstructionSection;
