import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  UsersIcon,
  CalendarIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
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

type DemoFormData = z.infer<typeof demoFormSchema>;

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

interface DemoRequestFormProps {
  preselectedProduct?: string;
  onSuccess?: () => void;
}

const DemoRequestForm: React.FC<DemoRequestFormProps> = ({ 
  preselectedProduct,
  onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    preselectedProduct ? [preselectedProduct] : []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      interests: preselectedProduct ? [preselectedProduct] : []
    }
  });

  // const watchedProducts = watch('interests'); // Unused variable

  const handleProductToggle = (productId: string) => {
    const updatedProducts = selectedProducts.includes(productId)
      ? selectedProducts.filter(id => id !== productId)
      : [...selectedProducts, productId];
    
    setSelectedProducts(updatedProducts);
    setValue('interests', updatedProducts);
  };

  const onSubmit = async (data: DemoFormData) => {
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
      } else {
        throw new Error(response.error || 'Demo request failed');
      }
      
    } catch (error) {
      const errorMessage = handleAPIError(error);
      toast.error(errorMessage);
      console.error('Demo request error:', error);
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
          className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CalendarIcon className="w-8 h-8 text-primary-600" />
        </motion.div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Demo Scheduled Successfully!
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Thank you for your interest! We'll send you a calendar invite within the next hour 
          with demo details and preparation materials.
        </p>
        
        <div className="space-y-3 text-sm text-gray-500 mb-8">
          <div className="flex items-center justify-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>Calendar invite sent to your email</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            <span>Demo customized for your selected products</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <PlayIcon className="w-4 h-4" />
            <span>30-minute interactive session</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">What to expect:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Live product demonstration</li>
            <li>• Customized use case examples</li>
            <li>• ROI calculations for your business</li>
            <li>• Q&A with our product experts</li>
            <li>• Next steps discussion</li>
          </ul>
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-4">
          <PlayIcon className="w-4 h-4 mr-2" />
          Interactive Demo Request
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          See Aurex in Action
        </h3>
        <p className="text-gray-600">
          Get a personalized 30-minute demo tailored to your ESG goals and use cases.
        </p>
      </div>

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
              Business Email *
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
              <PhoneIcon className="w-4 h-4 inline mr-2" />
              Phone Number (Optional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="form-input"
            />
          </div>
        </div>

        {/* Role and Company Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <option value="consultant">Consultant / Advisor</option>
              <option value="procurement">Procurement</option>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UsersIcon className="w-4 h-4 inline mr-2" />
              Company Size *
            </label>
            <select
              {...register('employees')}
              className={`form-input ${errors.employees ? 'border-red-500' : ''}`}
            >
              <option value="">Select company size</option>
              {companySizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
            <AnimatePresence>
              {errors.employees && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-600 text-sm mt-1 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.employees.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Implementation Timeline *
          </label>
          <select
            {...register('timeline')}
            className={`form-input ${errors.timeline ? 'border-red-500' : ''}`}
          >
            <option value="">Select timeline</option>
            {timelines.map((timeline) => (
              <option key={timeline.value} value={timeline.value}>
                {timeline.label}
              </option>
            ))}
          </select>
          <AnimatePresence>
            {errors.timeline && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-600 text-sm mt-1 flex items-center"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.timeline.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Product Interest */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Products to Demo * (Select all that interest you)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {productOptions.map((product) => (
              <motion.button
                key={product.id}
                type="button"
                onClick={() => handleProductToggle(product.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 relative ${
                  selectedProducts.includes(product.id)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{product.icon}</span>
                  <span className="text-sm font-medium">{product.label}</span>
                </div>
                {selectedProducts.includes(product.id) && (
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

        {/* Additional Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specific Use Cases or Questions (Optional)
          </label>
          <textarea
            {...register('message')}
            rows={3}
            placeholder="Tell us about your specific ESG challenges or what you'd like to see in the demo..."
            className="form-textarea"
          />
        </div>

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
                  Scheduling Demo...
                </motion.div>
              ) : (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center"
                >
                  <CalendarIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Schedule My Demo
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Demo Details */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-primary-600" />
            What You'll Get:
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>30-minute personalized demo focused on your selected products</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Live data examples relevant to your industry and use cases</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Custom ROI calculation based on your company size and needs</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Q&A session with our product experts and implementation team</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Next steps roadmap and trial access (if applicable)</span>
            </li>
          </ul>
        </div>
      </form>
    </motion.div>
  );
};

export default DemoRequestForm;