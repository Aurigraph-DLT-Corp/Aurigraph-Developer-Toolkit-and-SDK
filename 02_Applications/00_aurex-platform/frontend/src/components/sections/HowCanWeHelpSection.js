import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { UserGroupIcon, GlobeAltIcon, CheckBadgeIcon, SparklesIcon } from '@heroicons/react/24/outline';
const HowCanWeHelpSection = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
        rootMargin: '-50px 0px',
    });
    const helpItems = [
        {
            icon: UserGroupIcon,
            title: "Expert Team",
            description: "Leading specialists in carbon markets and regenerative systems",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: GlobeAltIcon,
            title: "Global Partnerships",
            description: "Collaborating with corporates, NGOs, and governments worldwide",
            color: "from-green-500 to-green-600"
        },
        {
            icon: CheckBadgeIcon,
            title: "Proven Impact",
            description: "Delivering measurable results in climate action and sustainability",
            color: "from-purple-500 to-purple-600"
        }
    ];
    return (_jsxs("section", { ref: ref, className: "section-padding bg-gradient-to-br from-gray-50 via-white to-primary-50 relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden", children: [_jsx("div", { className: "absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" }), _jsx("div", { className: "absolute bottom-20 right-10 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" })] }), _jsxs("div", { className: "max-w-7xl mx-auto container-padding relative z-10", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [_jsxs("div", { className: "inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-6", children: [_jsx(SparklesIcon, { className: "w-4 h-4 mr-2" }), "Climate-Tech Leadership"] }), _jsxs("h2", { className: "text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6", children: ["How Can We", _jsxs("span", { className: "bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent", children: [' ', "Help?"] })] }), _jsx("div", { className: "max-w-4xl mx-auto", children: _jsx("p", { className: "text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed", children: "Aurigraph Aurex is a pioneering climate-tech company at the forefront of carbon and regenerative solutions. We bridge the gap between environmental impact and technological innovation, creating pathways for organizations to achieve their Net Zero goals while fostering community development and ecosystem restoration." }) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8", children: helpItems.map((item, index) => {
                            const Icon = item.icon;
                            return (_jsx(motion.div, { initial: { opacity: 0, y: 50 }, animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }, transition: { duration: 0.6, delay: index * 0.2 }, className: "group relative", children: _jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 h-full", children: [_jsx(motion.div, { whileHover: { scale: 1.1, rotateY: 180 }, transition: { duration: 0.3 }, className: `w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`, children: _jsx(Icon, { className: "w-8 h-8 text-white" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors", children: item.title }), _jsx("p", { className: "text-gray-600 leading-relaxed", children: item.description }), _jsx("div", { className: "absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" })] }) }, item.title));
                        }) }), _jsx(motion.div, { initial: { opacity: 0, y: 30 }, animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }, transition: { duration: 0.6, delay: 0.8 }, className: "text-center mt-16", children: _jsxs("div", { className: "bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Ready to Transform Your ESG Impact?" }), _jsx("p", { className: "text-gray-600 mb-6", children: "Join hundreds of organizations already making a measurable difference with our climate-tech solutions." }), _jsx("button", { className: "btn-primary text-lg px-8 py-3", children: "Get Started Today" })] }) })] })] }));
};
export default HowCanWeHelpSection;
