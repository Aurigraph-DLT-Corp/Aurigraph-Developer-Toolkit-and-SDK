import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendContactEmail, ContactFormData } from '@/services/emailService';
import { Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';

interface ConsultationFormProps {
  onSuccess?: () => void;
  className?: string;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ 
  onSuccess,
  className = '' 
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: 'Consultation Request',
    message: '',
    platform: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please describe your consultation needs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const success = await sendContactEmail({
        ...formData,
        subject: `Consultation Request - ${formData.platform || 'General'}`
      });
      
      if (success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          subject: 'Consultation Request',
          message: '',
          platform: '',
        });
        onSuccess?.();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting consultation request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Consultation</h3>
        <p className="text-gray-600">
          Get expert guidance on your sustainability journey. Our team will help you choose the right solutions for your organization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Your full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email">Business Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 ${errors.email ? 'border-red-500' : ''}`}
              placeholder="your.email@company.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className={`bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 ${errors.company ? 'border-red-500' : ''}`}
              placeholder="Your company or organization"
            />
            {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="bg-white text-gray-900 border-gray-300 placeholder:text-gray-500"
              placeholder="+91 9945103337"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="platform">Area of Interest</Label>
          <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
            <SelectTrigger className="bg-white text-gray-900 border-gray-300">
              <SelectValue placeholder="Select your primary interest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Sustainability Consulting</SelectItem>
              <SelectItem value="launchpad">ESG Assessment & Net-Zero Planning</SelectItem>
              <SelectItem value="hydropulse">Water Management & AWD Solutions</SelectItem>
              <SelectItem value="sylvagraph">Forest Monitoring & Carbon Sequestration</SelectItem>
              <SelectItem value="carbontrace">Carbon Credit Trading & DMRV</SelectItem>
              <SelectItem value="integration">Platform Integration & Implementation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="message">Consultation Requirements *</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            className={`bg-white text-gray-900 border-gray-300 placeholder:text-gray-500 ${errors.message ? 'border-red-500' : ''}`}
            placeholder="Please describe your sustainability goals, current challenges, timeline, and specific areas where you need expert guidance..."
            rows={5}
          />
          {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Request...
            </>
          ) : (
            'Request Consultation'
          )}
        </Button>

        {submitStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Consultation request submitted successfully!</p>
              <p className="text-sm">Your consultation request has been sent directly to our sustainability experts. We will contact you within 24 hours to schedule your consultation.</p>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to submit consultation request</p>
              <p className="text-sm">Please try again or contact us directly at helpdesk@aurigraph.io</p>
            </div>
          </div>
        )}
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">What to expect from your consultation:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Comprehensive assessment of your current sustainability practices</li>
          <li>• Customized recommendations based on your industry and goals</li>
          <li>• Platform demonstration tailored to your specific needs</li>
          <li>• Implementation roadmap with timelines and milestones</li>
          <li>• ROI analysis and cost-benefit projections</li>
          <li>• Ongoing support and training recommendations</li>
        </ul>
      </div>
    </div>
  );
};

export default ConsultationForm;
