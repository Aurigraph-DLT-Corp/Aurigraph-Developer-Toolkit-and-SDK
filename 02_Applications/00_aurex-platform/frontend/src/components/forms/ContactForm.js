import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserIcon, EnvelopeIcon, BuildingOfficeIcon, BriefcaseIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// Utils
import { trackContactForm } from '../../utils/analytics';
import { submitContactForm, handleAPIError } from '../../utils/api';
// Form validation schema
const contactFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    company: z.string().min(2, 'Company name must be at least 2 characters'),
    role: z.string().min(2, 'Please specify your role'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
    interests: z.array(z.string()).min(1, 'Please select at least one area of interest'),
    consent: z.boolean().refine(val => val === true, 'You must agree to the privacy policy')
});
const interestOptions = [
    { id: 'esg-reporting', label: 'ESG Reporting & Compliance', icon: '📊' },
    { id: 'water-management', label: 'Water Management', icon: '💧' },
    { id: 'forest-monitoring', label: 'Forest Monitoring', icon: '🌲' },
    { id: 'carbon-credits', label: 'Carbon Credit Trading', icon: '🌱' },
    { id: 'sustainability', label: 'Sustainability Strategy', icon: '♻️' },
    { id: 'ai-analytics', label: 'AI & Analytics', icon: '🤖' }
];
const ContactForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [selectedInterests, setSelectedInterests] = useState([]);
    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            interests: []
        }
    });
    // const watchedInterests = watch('interests'); // Unused variable
    const handleInterestToggle = (interestId) => {
        const updatedInterests = selectedInterests.includes(interestId)
            ? selectedInterests.filter(id => id !== interestId)
            : [...selectedInterests, interestId];
        setSelectedInterests(updatedInterests);
        setValue('interests', updatedInterests);
    };
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Track form submission
            trackContactForm('contact_form');
            // Submit to backend API
            const response = await submitContactForm(data);
            if (response.success) {
                // Success handling
                setIsSubmitted(true);
                toast.success('Thank you! We\'ll get back to you within 24 hours.');
                // Reset form after delay
                setTimeout(() => {
                    setIsSubmitted(false);
                    reset();
                    setSelectedInterests([]);
                }, 5000);
            }
            else {
                throw new Error(response.error || 'Submission failed');
            }
        }
        catch (error) {
            const errorMessage = handleAPIError(error);
            toast.error(errorMessage);
            console.error('Form submission error:', error);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (isSubmitted) {
        return (_jsxs(motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "text-center py-12", children: [_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: 0.2, type: 'spring', bounce: 0.5 }, className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircleIcon, { className: "w-8 h-8 text-green-600" }) }), _jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-4", children: "Thank You for Your Interest!" }), _jsx("p", { className: "text-gray-600 mb-6 max-w-md mx-auto", children: "We've received your message and will get back to you within 24 hours. Our team is excited to help you transform your ESG impact." }), _jsxs("div", { className: "space-y-2 text-sm text-gray-500", children: [_jsx("p", { children: "\uD83D\uDCE7 Expect an email confirmation shortly" }), _jsx("p", { children: "\uD83D\uDE80 Typical response time: 2-4 hours" }), _jsx("p", { children: "\uD83D\uDCDE For urgent inquiries: +1 (555) 123-4567" })] })] }));
    }
    return (_jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, className: "max-w-2xl mx-auto", children: _jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(UserIcon, { className: "w-4 h-4 inline mr-2" }), "Full Name *"] }), _jsx("input", { ...register('name'), type: "text", placeholder: "John Doe", className: `form-input ${errors.name ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.name && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.name.message] })) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(EnvelopeIcon, { className: "w-4 h-4 inline mr-2" }), "Email Address *"] }), _jsx("input", { ...register('email'), type: "email", placeholder: "john@company.com", className: `form-input ${errors.email ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.email && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.email.message] })) })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(BuildingOfficeIcon, { className: "w-4 h-4 inline mr-2" }), "Company Name *"] }), _jsx("input", { ...register('company'), type: "text", placeholder: "Your Company", className: `form-input ${errors.company ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.company && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.company.message] })) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(BriefcaseIcon, { className: "w-4 h-4 inline mr-2" }), "Your Role *"] }), _jsxs("select", { ...register('role'), className: `form-input ${errors.role ? 'border-red-500' : ''}`, children: [_jsx("option", { value: "", children: "Select your role" }), _jsx("option", { value: "ceo", children: "CEO / Founder" }), _jsx("option", { value: "cto", children: "CTO / Technology Leader" }), _jsx("option", { value: "cso", children: "Chief Sustainability Officer" }), _jsx("option", { value: "esg-manager", children: "ESG Manager" }), _jsx("option", { value: "environmental-manager", children: "Environmental Manager" }), _jsx("option", { value: "finance", children: "Finance / CFO" }), _jsx("option", { value: "operations", children: "Operations Manager" }), _jsx("option", { value: "consultant", children: "Consultant" }), _jsx("option", { value: "other", children: "Other" })] }), _jsx(AnimatePresence, { children: errors.role && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.role.message] })) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-4", children: "Areas of Interest * (Select all that apply)" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: interestOptions.map((interest) => (_jsxs(motion.button, { type: "button", onClick: () => handleInterestToggle(interest.id), whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, className: `p-4 rounded-lg border-2 text-left transition-all duration-200 ${selectedInterests.includes(interest.id)
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'}`, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-2xl", children: interest.icon }), _jsx("span", { className: "text-sm font-medium", children: interest.label })] }), selectedInterests.includes(interest.id) && (_jsx(motion.div, { initial: { scale: 0 }, animate: { scale: 1 }, className: "absolute top-2 right-2", children: _jsx(CheckCircleIcon, { className: "w-5 h-5 text-primary-600" }) }))] }, interest.id))) }), _jsx(AnimatePresence, { children: errors.interests && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-2 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.interests.message] })) })] }), _jsxs("div", { children: [_jsxs("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: [_jsx(ChatBubbleLeftRightIcon, { className: "w-4 h-4 inline mr-2" }), "How can we help you? *"] }), _jsx("textarea", { ...register('message'), rows: 4, placeholder: "Tell us about your ESG goals, challenges, or questions...", className: `form-textarea ${errors.message ? 'border-red-500' : ''}` }), _jsx(AnimatePresence, { children: errors.message && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm mt-1 flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.message.message] })) })] }), _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("input", { ...register('consent'), type: "checkbox", id: "consent", className: "mt-1" }), _jsxs("label", { htmlFor: "consent", className: "text-sm text-gray-600", children: ["I agree to the", ' ', _jsx("a", { href: "/privacy", className: "text-primary-600 hover:text-primary-700 underline", children: "Privacy Policy" }), ' ', "and consent to being contacted by Aurex regarding my inquiry. *"] })] }), _jsx(AnimatePresence, { children: errors.consent && (_jsxs(motion.p, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, className: "text-red-600 text-sm flex items-center", children: [_jsx(ExclamationTriangleIcon, { className: "w-4 h-4 mr-1" }), errors.consent.message] })) }), _jsx("div", { className: "pt-4", children: _jsx(motion.button, { type: "submit", disabled: isSubmitting, whileHover: { scale: isSubmitting ? 1 : 1.02 }, whileTap: { scale: isSubmitting ? 1 : 0.98 }, className: "w-full btn-primary group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed", children: _jsx(AnimatePresence, { mode: "wait", children: isSubmitting ? (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "flex items-center justify-center", children: [_jsx("div", { className: "w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" }), "Sending Message..."] }, "loading")) : (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "flex items-center justify-center", children: [_jsx(PaperAirplaneIcon, { className: "w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" }), "Send Message"] }, "send")) }) }) }), _jsxs("div", { className: "mt-8 pt-8 border-t border-gray-200 text-center", children: [_jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Prefer to reach out directly?" }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-center gap-4 text-sm", children: [_jsxs("a", { href: "mailto:hello@aurex.com", className: "text-primary-600 hover:text-primary-700 flex items-center justify-center gap-2", children: [_jsx(EnvelopeIcon, { className: "w-4 h-4" }), "hello@aurex.com"] }), _jsx("span", { className: "hidden sm:inline text-gray-400", children: "|" }), _jsx("a", { href: "tel:+1-555-123-4567", className: "text-primary-600 hover:text-primary-700 flex items-center justify-center gap-2", children: "\uD83D\uDCDE +1 (555) 123-4567" })] })] })] }) }));
};
export default ContactForm;
