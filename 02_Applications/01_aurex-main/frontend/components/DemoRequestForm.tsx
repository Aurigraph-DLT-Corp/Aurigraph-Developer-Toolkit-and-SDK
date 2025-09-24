import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendDemoRequestEmail } from '@/services/emailService';
import { Loader2, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface DemoRequestFormProps {
  defaultPlatform?: string;
  onSuccess?: () => void;
  className?: string;
}

interface DemoFormData {
  name: string;
  email: string;
  company: string;
  platform: string;
  preferredDate: string;
  message: string;
}

const DemoRequestForm: React.FC<DemoRequestFormProps> = ({ 
  defaultPlatform = '', 
  onSuccess,
  className = '' 
}) => {
  const [formData, setFormData] = useState<DemoFormData>({
    name: '',
    email: '',
    company: '',
    platform: defaultPlatform,
    preferredDate: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<DemoFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<DemoFormData> = {};

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

    if (!formData.platform) {
      newErrors.platform = 'Please select a platform';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DemoFormData, value: string) => {
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
      const success = await sendDemoRequestEmail(formData);
      
      if (success) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          company: '',
          platform: defaultPlatform,
          preferredDate: '',
          message: '',
        });
        onSuccess?.();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformDisplayName = (value: string) => {
    const platforms = {
      'launchpad': 'Aurex Launchpad (ESG Assessment)',
      'hydropulse': 'Aurex HydroPulse (Water Management)',
      'sylvagraph': 'Aurex SylvaGraph (Forest Monitoring)',
      'carbontrace': 'Aurex CarbonTrace (Carbon Trading)',
    };
    return platforms[value as keyof typeof platforms] || value;
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="text-center mb-8">
        <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule a Demo</h2>
        <p className="text-gray-600">
          See how our sustainability platforms can transform your organization's environmental impact
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
              className={errors.name ? 'border-red-500' : ''}
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
              className={errors.email ? 'border-red-500' : ''}
              placeholder="your.email@company.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="company">Company Name *</Label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className={errors.company ? 'border-red-500' : ''}
            placeholder="Your company or organization"
          />
          {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
        </div>

        <div>
          <Label htmlFor="platform">Platform of Interest *</Label>
          <Select value={formData.platform} onValueChange={(value) => handleInputChange('platform', value)}>
            <SelectTrigger className={errors.platform ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select the platform you'd like to see" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="launchpad">Aurex Launchpad (ESG Assessment)</SelectItem>
              <SelectItem value="hydropulse">Aurex HydroPulse (Water Management)</SelectItem>
              <SelectItem value="sylvagraph">Aurex SylvaGraph (Forest Monitoring)</SelectItem>
              <SelectItem value="carbontrace">Aurex CarbonTrace (Carbon Trading)</SelectItem>
            </SelectContent>
          </Select>
          {errors.platform && <p className="text-red-500 text-sm mt-1">{errors.platform}</p>}
        </div>

        <div>
          <Label htmlFor="preferredDate">Preferred Date & Time</Label>
          <Input
            id="preferredDate"
            type="text"
            value={formData.preferredDate}
            onChange={(e) => handleInputChange('preferredDate', e.target.value)}
            placeholder="e.g., Next week, Monday 2PM EST, or any specific date/time"
          />
          <p className="text-sm text-gray-500 mt-1">
            Our team will contact you to confirm the exact time
          </p>
        </div>

        <div>
          <Label htmlFor="message">Additional Information</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Tell us about your sustainability goals, current challenges, or specific features you'd like to see..."
            rows={4}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling Demo...
            </>
          ) : (
            'Schedule Demo'
          )}
        </Button>

        {submitStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Demo request submitted successfully!</p>
              <p className="text-sm">Our team will contact you within 24 hours to schedule your personalized demo.</p>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to submit demo request</p>
              <p className="text-sm">Please try again or contact us directly at {import.meta.env.VITE_SUPPORT_EMAIL}</p>
            </div>
          </div>
        )}
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">What to expect in your demo:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Personalized walkthrough of {formData.platform ? getPlatformDisplayName(formData.platform) : 'your selected platform'}</li>
          <li>• Live demonstration of key features and capabilities</li>
          <li>• Discussion of your specific sustainability goals and challenges</li>
          <li>• Q&A session with our sustainability experts</li>
          <li>• Custom implementation roadmap for your organization</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoRequestForm;
