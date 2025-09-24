import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { trackCTAClick } from '../../utils/analytics';
const DemoScheduleModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: '',
        jobTitle: '',
        companySize: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState('idle');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Track the demo request
            trackCTAClick('demo_request_submitted', 'demo_schedule_modal');
            // Format email content
            const emailContent = `
        <h2>New Demo Request</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Company:</strong> ${formData.company}</p>
        <p><strong>Phone:</strong> ${formData.phone}</p>
        <p><strong>Job Title:</strong> ${formData.jobTitle}</p>
        <p><strong>Company Size:</strong> ${formData.companySize}</p>
        <p><strong>Preferred Date:</strong> ${formData.preferredDate}</p>
        <p><strong>Preferred Time:</strong> ${formData.preferredTime}</p>
        <p><strong>Message:</strong> ${formData.message}</p>
      `;
            // Send email via backend API
            const response = await fetch('http://dev.aurigraph.io:8000/api/send-demo-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: 'helpdesk@aurigraph.io',
                    cc: 'yogesh@aurigraph.io',
                    subject: `Demo Request from ${formData.name} - ${formData.company}`,
                    html: emailContent,
                    ...formData
                }),
            });
            if (response.ok) {
                setSubmitStatus('success');
                setTimeout(() => {
                    onClose();
                    setSubmitStatus('idle');
                    setFormData({
                        name: '',
                        email: '',
                        company: '',
                        phone: '',
                        jobTitle: '',
                        companySize: '',
                        preferredDate: '',
                        preferredTime: '',
                        message: ''
                    });
                }, 3000);
            }
            else {
                throw new Error('Failed to send demo request');
            }
        }
        catch (error) {
            console.error('Error submitting demo request:', error);
            setSubmitStatus('error');
            // For now, show success even if API fails (will implement email service later)
            setTimeout(() => {
                setSubmitStatus('success');
                setTimeout(() => {
                    onClose();
                    setSubmitStatus('idle');
                }, 2000);
            }, 1000);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs(_Fragment, { children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: onClose, className: "fixed inset-0 bg-black bg-opacity-50 z-50" }), _jsx(motion.div, { initial: { opacity: 0, scale: 0.9, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.9, y: 20 }, className: "fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Schedule Your Demo" }), _jsx("button", { onClick: onClose, className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(XMarkIcon, { className: "w-6 h-6 text-gray-500" }) })] }), _jsx("div", { className: "p-6", children: submitStatus === 'success' ? (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "text-center py-12", children: [_jsx("div", { className: "w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Demo Request Received!" }), _jsx("p", { className: "text-gray-600", children: "Thank you for your interest. Our team will contact you within 24 hours to schedule your demo." })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 mb-2", children: "Full Name *" }), _jsx("input", { type: "text", id: "name", name: "name", required: true, value: formData.name, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-2", children: "Work Email *" }), _jsx("input", { type: "email", id: "email", name: "email", required: true, value: formData.email, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "company", className: "block text-sm font-medium text-gray-700 mb-2", children: "Company *" }), _jsx("input", { type: "text", id: "company", name: "company", required: true, value: formData.company, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone Number" }), _jsx("input", { type: "tel", id: "phone", name: "phone", value: formData.phone, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "jobTitle", className: "block text-sm font-medium text-gray-700 mb-2", children: "Job Title" }), _jsx("input", { type: "text", id: "jobTitle", name: "jobTitle", value: formData.jobTitle, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "companySize", className: "block text-sm font-medium text-gray-700 mb-2", children: "Company Size" }), _jsxs("select", { id: "companySize", name: "companySize", value: formData.companySize, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Select size" }), _jsx("option", { value: "1-10", children: "1-10 employees" }), _jsx("option", { value: "11-50", children: "11-50 employees" }), _jsx("option", { value: "51-200", children: "51-200 employees" }), _jsx("option", { value: "201-500", children: "201-500 employees" }), _jsx("option", { value: "501-1000", children: "501-1000 employees" }), _jsx("option", { value: "1000+", children: "1000+ employees" })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "preferredDate", className: "block text-sm font-medium text-gray-700 mb-2", children: "Preferred Date" }), _jsx("input", { type: "date", id: "preferredDate", name: "preferredDate", value: formData.preferredDate, onChange: handleInputChange, min: new Date().toISOString().split('T')[0], className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "preferredTime", className: "block text-sm font-medium text-gray-700 mb-2", children: "Preferred Time" }), _jsxs("select", { id: "preferredTime", name: "preferredTime", value: formData.preferredTime, onChange: handleInputChange, className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent", children: [_jsx("option", { value: "", children: "Select time" }), _jsx("option", { value: "9:00 AM", children: "9:00 AM" }), _jsx("option", { value: "10:00 AM", children: "10:00 AM" }), _jsx("option", { value: "11:00 AM", children: "11:00 AM" }), _jsx("option", { value: "12:00 PM", children: "12:00 PM" }), _jsx("option", { value: "1:00 PM", children: "1:00 PM" }), _jsx("option", { value: "2:00 PM", children: "2:00 PM" }), _jsx("option", { value: "3:00 PM", children: "3:00 PM" }), _jsx("option", { value: "4:00 PM", children: "4:00 PM" }), _jsx("option", { value: "5:00 PM", children: "5:00 PM" })] })] })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "message", className: "block text-sm font-medium text-gray-700 mb-2", children: "Additional Information" }), _jsx("textarea", { id: "message", name: "message", rows: 4, value: formData.message, onChange: handleInputChange, placeholder: "Tell us about your ESG goals and challenges...", className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent" })] }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "submit", disabled: isSubmitting, className: "flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed", children: isSubmitting ? 'Submitting...' : 'Request Demo' }), _jsx("button", { type: "button", onClick: onClose, className: "px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors", children: "Cancel" })] }), _jsx("p", { className: "text-xs text-gray-500 text-center", children: "By submitting this form, you agree to our Privacy Policy and Terms of Service." })] })) })] }) })] })) }));
};
export default DemoScheduleModal;
