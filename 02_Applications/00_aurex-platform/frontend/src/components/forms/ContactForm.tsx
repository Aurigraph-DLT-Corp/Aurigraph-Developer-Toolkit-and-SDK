import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
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

type ContactFormData = z.infer<typeof contactFormSchema>;

const interestOptions = [
  { id: 'esg-reporting', label: 'ESG Reporting & Compliance', icon: '📊' },
  { id: 'water-management', label: 'Water Management', icon: '💧' },
  { id: 'forest-monitoring', label: 'Forest Monitoring', icon: '🌲' },
  { id: 'carbon-credits', label: 'Carbon Credit Trading', icon: '🌱' },
  { id: 'sustainability', label: 'Sustainability Strategy', icon: '♻️' },
  { id: 'ai-analytics', label: 'AI & Analytics', icon: '🤖' }
];

const ContactForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      interests: []
    }
  });

  // const watchedInterests = watch('interests'); // Unused variable

  const handleInterestToggle = (interestId: string) => {
    const updatedInterests = selectedInterests.includes(interestId)
      ? selectedInterests.filter(id => id !== interestId)
      : [...selectedInterests, interestId];
    
    setSelectedInterests(updatedInterests);
    setValue('interests', updatedInterests);
  };

  const onSubmit = async (data: ContactFormData) => {
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
      } else {
        throw new Error(response.error || 'Submission failed');
      }
      
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </motion.div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Thank You for Your Interest!
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We've received your message and will get back to you within 24 hours. 
          Our team is excited to help you transform your ESG impact.
        </p>
        
        <div className="space-y-2 text-sm text-gray-500">
          <p>📧 Expect an email confirmation shortly</p>
          <p>🚀 Typical response time: 2-4 hours</p>
          <p>📞 For urgent inquiries: +1 (555) 123-4567</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 inline mr-2" />
              Full Name *
            </label>
            <input
              {...register('name')}
              type="text"
              placeholder="John Doe"
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm mt-1 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.name.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <EnvelopeIcon className="w-4 h-4 inline mr-2" />
              Email Address *
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="john@company.com"
              className={`form-input ${errors.email ? 'border-red-500' : ''}`}
            />
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm mt-1 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Company Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
              Company Name *
            </label>
            <input
              {...register('company')}
              type="text"
              placeholder="Your Company"
              className={`form-input ${errors.company ? 'border-red-500' : ''}`}
            />
            <AnimatePresence>
              {errors.company && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm mt-1 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.company.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BriefcaseIcon className="w-4 h-4 inline mr-2" />
              Your Role *
            </label>
            <select
              {...register('role')}
              className={`form-input ${errors.role ? 'border-red-500' : ''}`}
            >
              <option value="">Select your role</option>
              <option value="ceo">CEO / Founder</option>
              <option value="cto">CTO / Technology Leader</option>
              <option value="cso">Chief Sustainability Officer</option>
              <option value="esg-manager">ESG Manager</option>
              <option value="environmental-manager">Environmental Manager</option>
              <option value="finance">Finance / CFO</option>
              <option value="operations">Operations Manager</option>
              <option value="consultant">Consultant</option>
              <option value="other">Other</option>
            </select>
            <AnimatePresence>
              {errors.role && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm mt-1 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.role.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Areas of Interest */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Areas of Interest * (Select all that apply)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {interestOptions.map((interest) => (
              <motion.button
                key={interest.id}
                type="button"
                onClick={() => handleInterestToggle(interest.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedInterests.includes(interest.id)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{interest.icon}</span>
                  <span className="text-sm font-medium">{interest.label}</span>
                </div>
                {selectedInterests.includes(interest.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2"
                  >
                    <CheckCircleIcon className="w-5 h-5 text-primary-600" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {errors.interests && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-sm mt-2 flex items-center"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.interests.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2" />
            How can we help you? *
          </label>
          <textarea
            {...register('message')}
            rows={4}
            placeholder="Tell us about your ESG goals, challenges, or questions..."
            className={`form-textarea ${errors.message ? 'border-red-500' : ''}`}
          />
          <AnimatePresence>
            {errors.message && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-sm mt-1 flex items-center"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.message.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Consent */}
        <div className="flex items-start gap-3">
          <input
            {...register('consent')}
            type="checkbox"
            id="consent"
            className="mt-1"
          />
          <label htmlFor="consent" className="text-sm text-gray-600">
            I agree to the{' '}
            <a href="/privacy" className="text-primary-600 hover:text-primary-700 underline">
              Privacy Policy
            </a>{' '}
            and consent to being contacted by Aurex regarding my inquiry. *
          </label>
        </div>
        <AnimatePresence>
          {errors.consent && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-600 text-sm flex items-center"
            >
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              {errors.consent.message}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="pt-4">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="w-full btn-primary group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {isSubmitting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Message...
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <PaperAirplaneIcon className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                  Send Message
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Contact Information */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Prefer to reach out directly?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-sm">
            <a
              href="mailto:hello@aurex.com"
              className="text-primary-600 hover:text-primary-700 flex items-center justify-center gap-2"
            >
              <EnvelopeIcon className="w-4 h-4" />
              hello@aurex.com
            </a>
            <span className="hidden sm:inline text-gray-400">|</span>
            <a
              href="tel:+1-555-123-4567"
              className="text-primary-600 hover:text-primary-700 flex items-center justify-center gap-2"
            >
              📞 +1 (555) 123-4567
            </a>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default ContactForm;