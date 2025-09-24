import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserIcon, EnvelopeIcon, BuildingOfficeIcon, PhoneIcon, UsersIcon, CalendarIcon, PlayIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// Utils
import { trackDemoRequest } from '../../utils/analytics';
import { submitDemoRequest, handleAPIError } from '../../utils/api';
// Form validation schema
const demoFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    company: z.string().min(2, 'Company name must be at least 2 characters'),
    role: z.string().min(2, 'Please specify your role'),
    phone: z.string().optional(),
    employees: z.string().min(1, 'Please select company size'),
    timeline: z.string().min(1, 'Please select implementation timeline'),
    interests: z.array(z.string()).min(1, 'Please select at least one product'),
    message: z.string().optional()
});
const productOptions = [
    { id: 'launchpad', label: 'Launchpad - ESG Assessment', icon: '🚀' },
    { id: 'hydropulse', label: 'HydroPulse - Water Management', icon: '💧' },
    { id: 'sylvagraph', label: 'Sylvagraph - Forest Monitoring', icon: '🌲' },
    { id: 'carbontrace', label: 'CarbonTrace - Carbon Trading', icon: '🌱' },
    { id: 'full-platform', label: 'Complete DMRV Platform', icon: '🔧' }
];
const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-1000', label: '201-1,000 employees' },
    { value: '1000+', label: '1,000+ employees' }
];
const timelines = [
    { value: 'immediate', label: 'Immediate (This month)' },
    { value: '1-3-months', label: '1-3 months' },
    { value: '3-6-months', label: '3-6 months' },
    { value: '6-12-months', label: '6-12 months' },
    { value: 'exploring', label: 'Just exploring options' }
];
const DemoRequestForm = ({ preselectedProduct, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState(preselectedProduct ? [preselectedProduct] : []);
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
        resolver: zodResolver(demoFormSchema),
        defaultValues: {
            interests: preselectedProduct ? [preselectedProduct] : []
        }
    });
    // const watchedProducts = watch('interests'); // Unused variable
    const handleProductToggle = (productId) => {
        const updatedProducts = selectedProducts.includes(productId)
            ? selectedProducts.filter(id => id !== productId)
            : [...selectedProducts, productId];
        setSelectedProducts(updatedProducts);
        setValue('interests', updatedProducts);
    };
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Track demo request
            trackDemoRequest('demo_form');
            // Submit to backend API
            const response = await submitDemoRequest(data);
            if (response.success) {
                // Success handling
                setIsSubmitted(true);
                toast.success('Demo scheduled! Check your email for calendar invite.');
                // Call success callback
                onSuccess?.();
                // Reset form after delay
                setTimeout(() => {
                    setIsSubmitted(false);
                    reset();
                    setSelectedProducts(preselectedProduct ? [preselectedProduct] : []);
                }, 5000);
            }
            else {
                throw new Error(response.error || 'Demo request failed');
            }
        }
        catch (error) {
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage);
            console.error('Demo request error:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (isSubmitted) {
        return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "text-center py-12", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring', bounce: 0.5 }, className: "w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(CalendarIcon, { className: "w-8 h-8 text-primary-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Demo Scheduled Successfully!" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-md mx-auto", children: "Thank you for your interest! We'll send you a calendar invite within the next hour with demo details and preparation materials." }), _jsxs("div", { className: "space-y-3 text-sm text-gray-500 mb-8", children: [_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(CalendarIcon, { className: "w-4 h-4" }), _jsx("span", { children: "Calendar invite sent to your email" })] }), _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(SparklesIcon, { className: "w-4 h-4" }), _jsx("span", { children: "Demo customized for your selected products" })] }), _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(PlayIcon, { className: "w-4 h-4" }), _jsx("span", { children: "30-minute interactive session" })] })] }), _jsxs("div", { className: "bg-gray-50 rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "What to expect:" }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-1", children: [_jsx("li", { children: "\u2022 Live product demonstration" }), _jsx("li", { children: "\u2022 Customized use case examples" }), _jsx("li", { children: "\u2022 ROI calculations for your business" }), _jsx("li", { children: "\u2022 Q&A with our product experts" }), _jsx("li", { children: "\u2022 Next steps discussion" })] })] })] }));
    }
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs("div", { className: "inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-4", children: [_jsx(PlayIcon, { className: "w-4 h-4 mr-2" }), "Interactive Demo Request"] }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "See Aurex in Action" }), _jsx("p", { className: "text-gray-600", children: "Get a personalized 30-minute demo tailored to your ESG goals and use cases." })] }), _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(UserIcon, { className: "w-4 h-4 inline mr-2" }), "Full Name *"] }), _jsx("input", { ...register('name'), type: "text", placeholder: "John Doe", className: `form-input ${errors.name ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.name && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.name.message] })) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(EnvelopeIcon, { className: "w-4 h-4 inline mr-2" }), "Business Email *"] }), _jsx("input", { ...register('email'), type: "email", placeholder: "john@company.com", className: `form-input ${errors.email ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.email && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.email.message] })) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(BuildingOfficeIcon, { className: "w-4 h-4 inline mr-2" }), "Company Name *"] }), _jsx("input", { ...register('company'), type: "text", placeholder: "Your Company", className: `form-input ${errors.company ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.company && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.company.message] })) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(PhoneIcon, { className: "w-4 h-4 inline mr-2" }), "Phone Number (Optional)"] }), _jsx("input", { ...register('phone'), type: "tel", placeholder: "+1 (555) 123-4567", className: "form-input" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Your Role *" }), _jsxs("select", { ...register('role'), className: `form-input ${errors.role ? 'border-red-500' : ''}`, children: [_jsx("option", { value: "", children: "Select your role" }), _jsx("option", { value: "ceo", children: "CEO / Founder" }), _jsx("option", { value: "cto", children: "CTO / Technology Leader" }), _jsx("option", { value: "cso", children: "Chief Sustainability Officer" }), _jsx("option", { value: "esg-manager", children: "ESG Manager" }), _jsx("option", { value: "environmental-manager", children: "Environmental Manager" }), _jsx("option", { value: "finance", children: "Finance / CFO" }), _jsx("option", { value: "operations", children: "Operations Manager" }), _jsx("option", { value: "consultant", children: "Consultant / Advisor" }), _jsx("option", { value: "procurement", children: "Procurement" }), _jsx("option", { value: "other", children: "Other" })] }), _jsx(AnimatePresence, { children: errors.role && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.role.message] })) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(UsersIcon, { className: "w-4 h-4 inline mr-2" }), "Company Size *"] }), _jsxs("select", { ...register('employees'), className: `form-input ${errors.employees ? 'border-red-500' : ''}`, children: [_jsx("option", { value: "", children: "Select company size" }), companySizes.map((size) => (_jsx("option", { value: size.value, children: size.label }, size.value)))] }), _jsx(AnimatePresence, { children: errors.employees && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.employees.message] })) })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(CalendarIcon, { className: "w-4 h-4 inline mr-2" }), "Implementation Timeline *"] }), _jsxs("select", { ...register('timeline'), className: `form-input ${errors.timeline ? 'border-red-500' : ''}`, children: [_jsx("option", { value: "", children: "Select timeline" }), timelines.map((timeline) => (_jsx("option", { value: timeline.value, children: timeline.label }, timeline.value)))] }), _jsx(AnimatePresence, { children: errors.timeline && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.timeline.message] })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Products to Demo * (Select all that interest you)" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: productOptions.map((product) => (_jsxs(motion.button, { type: "button", onClick: () => handleProductToggle(product.id), whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, className: `p-4 rounded-lg border-2 text-left transition-all duration-200 relative ${selectedProducts.includes(product.id)
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: product.icon }), _jsx("span", { className: "text-sm font-medium", children: product.label })] }), selectedProducts.includes(product.id) && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute top-2 right-2", children: _jsx(CheckCircleIcon, { className: "w-5 h-5 text-primary-600" }) }))] }, product.id))) }), _jsx(AnimatePresence, { children: errors.interests && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-2 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.interests.message] })) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Specific Use Cases or Questions (Optional)" }), _jsx("textarea", { ...register('message'), rows: 3, placeholder: "Tell us about your specific ESG challenges or what you'd like to see in the demo...", className: "form-textarea" })] }), _jsx("div", { className: "pt-4", children: _jsx(motion.button, { type: "submit", disabled: isSubmitting, whileHover: { scale: isSubmitting ? 1 : 1.02 }, whileTap: { scale: isSubmitting ? 1 : 0.98 }, className: "w-full btn-primary group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx(AnimatePresence, { mode: "wait", children: isSubmitting ? (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "flex items-center justify-center", children: [_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), "Scheduling Demo..."] }, "loading")) : (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "flex items-center justify-center", children: [_jsx(CalendarIcon, { className: "w-5 h-5 mr-2 group-hover:scale-110 transition-transform" }), "Schedule My Demo"] }, "schedule")) }) }) }), _jsxs("div", { className: "mt-6 bg-gray-50 rounded-lg p-4", children: [_jsxs("h4", { className: "font-semibold text-gray-900 mb-3 flex items-center", children: [_jsx(SparklesIcon, { className: "w-5 h-5 mr-2 text-primary-600" }), "What You'll Get:"] }), _jsxs("ul", { className: "text-sm text-gray-600 space-y-2", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircleIcon, { className: "w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: "30-minute personalized demo focused on your selected products" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircleIcon, { className: "w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: "Live data examples relevant to your industry and use cases" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircleIcon, { className: "w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: "Custom ROI calculation based on your company size and needs" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircleIcon, { className: "w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: "Q&A session with our product experts and implementation team" })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx(CheckCircleIcon, { className: "w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" }), _jsx("span", { children: "Next steps roadmap and trial access (if applicable)" })] })] })] })] })] }));
};
export default DemoRequestForm;
