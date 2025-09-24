import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChartBarIcon, ComputerDesktopIcon, ShieldCheckIcon, CurrencyDollarIcon, CheckBadgeIcon, ArrowTrendingUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import CountUp from 'react-countup';
// Data
import { benefits } from '../../data/content';
const iconMap = {
    chart: ChartBarIcon,
    monitor: ComputerDesktopIcon,
    shield: ShieldCheckIcon,
    savings: CurrencyDollarIcon,
};
const BenefitCard = ({ benefit, index, isInView }) => {
    const [isHovered, setIsHovered] = useState(false);
    const IconComponent = iconMap[benefit.icon];
    return (_jsx(motion.div, { initial: { opacity: 0, y: 50 }, animate: isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }, transition: { duration: 0.6, delay: index * 0.2 }, onHoverStart: () => setIsHovered(true), onHoverEnd: () => setIsHovered(false), className: "group w-full h-full flex", children: _jsxs("div", { className: "card-interactive w-full h-full p-8 bg-white relative overflow-hidden flex flex-col", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-50" }), _jsx(motion.div, { animate: isHovered ? { scale: 1.1, opacity: 0.1 } : { scale: 1, opacity: 0.05 }, transition: { duration: 0.3 }, className: "absolute -top-4 -right-4 w-24 h-24 bg-primary-200 rounded-full" }), _jsx("div", { className: "relative z-10 flex flex-col h-full", children: _jsxs("div", { className: "flex-grow flex flex-col", children: [_jsxs("div", { className: "flex-grow", children: [_jsx(motion.div, { animate: isHovered ? { scale: 1.1, rotateY: 180 } : { scale: 1, rotateY: 0 }, transition: { duration: 0.3 }, className: "w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg", children: _jsx(IconComponent, { className: "w-8 h-8 text-white" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors", children: benefit.title }), _jsx("p", { className: "text-gray-600 mb-6 leading-relaxed", children: benefit.description }), _jsx("div", { className: "mb-6", children: _jsxs(motion.div, { initial: { scale: 0 }, animate: isInView ? { scale: 1 } : { scale: 0 }, transition: { duration: 0.6, delay: index * 0.3 + 0.5 }, className: "inline-flex items-center px-4 py-2 bg-accent-100 text-accent-700 rounded-full font-bold text-lg", children: [_jsx(ArrowTrendingUpIcon, { className: "w-5 h-5 mr-2" }), benefit.statistic] }) })] }), _jsx("div", { className: "space-y-3", children: benefit.features.map((feature, featureIndex) => (_jsxs(motion.div, { initial: { opacity: 0, x: -20 }, animate: isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }, transition: { duration: 0.4, delay: index * 0.2 + featureIndex * 0.1 + 0.8 }, className: "flex items-center gap-3", children: [_jsx("div", { className: "w-5 h-5 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0", children: _jsx(CheckBadgeIcon, { className: "w-3 h-3 text-accent-600" }) }), _jsx("span", { className: "text-sm text-gray-700", children: feature })] }, feature))) })] }) })] }) }));
};
const BenefitsSection = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
        rootMargin: '-50px 0px',
    });
    const [activeMetric, setActiveMetric] = useState(0);
    const keyMetrics = [
        { label: 'Faster Reporting', value: 90, suffix: '%', color: 'text-primary-600' },
        { label: 'Cost Reduction', value: 60, suffix: '%', color: 'text-accent-600' },
        { label: 'Compliance Rate', value: 100, suffix: '%', color: 'text-green-600' },
        { label: 'Time Savings', value: 24, suffix: '/7', color: 'text-blue-600' }
    ];
    React.useEffect(() => {
        if (inView) {
            const interval = setInterval(() => {
                setActiveMetric((prev) => (prev + 1) % keyMetrics.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [inView, keyMetrics.length]);
    return (_jsxs("section", { ref: ref, className: "section-padding bg-gradient-to-br from-gray-50 to-white relative overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0 overflow-hidden", children: [_jsx("div", { className: "absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" }), _jsx("div", { className: "absolute bottom-20 right-10 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" })] }), _jsxs("div", { className: "max-w-7xl mx-auto container-padding relative z-10", children: [_jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }, transition: { duration: 0.6 }, className: "text-center mb-16", children: [_jsxs("div", { className: "inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-6", children: [_jsx(SparklesIcon, { className: "w-4 h-4 mr-2" }), "Proven Results & Benefits"] }), _jsxs("h2", { className: "text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6", children: ["Why Organizations Choose", _jsxs("span", { className: "bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent", children: [' ', "Aurex"] })] }), _jsx("p", { className: "text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-12", children: "Join 450+ organizations already transforming their ESG impact with our intelligent DMRV platform. See the measurable results they're achieving." }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16", children: keyMetrics.map((metric, index) => (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }, transition: { duration: 0.6, delay: index * 0.1 }, className: `text-center p-4 md:p-6 rounded-xl ${activeMetric === index ? 'bg-white shadow-lg scale-105' : 'bg-white/50'} transition-all duration-500`, children: [_jsxs(motion.div, { className: `text-2xl md:text-4xl font-bold mb-2 ${metric.color}`, children: [inView && (_jsx(CountUp, { start: 0, end: metric.value, duration: 2, delay: index * 0.2 })), metric.suffix] }, `${metric.value}-${activeMetric === index}`), _jsx("div", { className: "text-sm font-medium text-gray-700", children: metric.label })] }, metric.label))) })] }), _jsx("div", { className: "relative mb-16", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch", children: benefits.map((benefit, index) => (_jsx(motion.div, { initial: { opacity: 0, y: 50 }, animate: inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }, transition: { duration: 0.6, delay: index * 0.1 }, className: "flex h-full", children: _jsx(BenefitCard, { benefit: benefit, index: index, isInView: inView }) }, benefit.title))) }) })] })] }));
};
export default BenefitsSection;
