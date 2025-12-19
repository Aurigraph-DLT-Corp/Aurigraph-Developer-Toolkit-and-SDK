/**
 * RWAT Interest Wizard - Multi-step wizard for Real World Asset Tokenization interest capture
 *
 * @description Interactive wizard for capturing user interest in RWA tokenization
 * @author Frontend Development Agent (FDA)
 * @since V12.0.0
 * @see AV11-593
 */

import React, { useState, useCallback } from 'react';

// Types
interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface AssetDetails {
  assetType: string;
  assetName: string;
  estimatedValue: string;
  location: string;
  description: string;
}

interface ContactInfo {
  fullName: string;
  email: string;
  company: string;
  phone: string;
  preferredContact: string;
}

interface InterestDetails {
  timeline: string;
  budget: string;
  goals: string[];
  additionalInfo: string;
}

interface WizardData {
  asset: AssetDetails;
  contact: ContactInfo;
  interest: InterestDetails;
}

// Constants
const WIZARD_STEPS: WizardStep[] = [
  { id: 'asset', title: 'Asset Information', description: 'Tell us about your asset' },
  { id: 'contact', title: 'Contact Details', description: 'How can we reach you?' },
  { id: 'interest', title: 'Your Goals', description: 'What are you looking to achieve?' },
  { id: 'review', title: 'Review & Submit', description: 'Review your information' },
];

const ASSET_TYPES = [
  { value: 'commercial_real_estate', label: 'Commercial Real Estate' },
  { value: 'residential_property', label: 'Residential Property' },
  { value: 'land', label: 'Land & Development' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'art_collectibles', label: 'Art & Collectibles' },
  { value: 'carbon_credits', label: 'Carbon Credits' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'other', label: 'Other' },
];

const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediate (< 1 month)' },
  { value: 'short_term', label: 'Short-term (1-3 months)' },
  { value: 'medium_term', label: 'Medium-term (3-6 months)' },
  { value: 'long_term', label: 'Long-term (6+ months)' },
  { value: 'exploring', label: 'Just exploring' },
];

const BUDGET_OPTIONS = [
  { value: 'under_100k', label: 'Under $100,000' },
  { value: '100k_500k', label: '$100,000 - $500,000' },
  { value: '500k_1m', label: '$500,000 - $1,000,000' },
  { value: '1m_5m', label: '$1,000,000 - $5,000,000' },
  { value: '5m_plus', label: '$5,000,000+' },
];

const GOAL_OPTIONS = [
  { value: 'liquidity', label: 'Increase Liquidity' },
  { value: 'fractional', label: 'Enable Fractional Ownership' },
  { value: 'global_access', label: 'Access Global Investors' },
  { value: 'transparency', label: 'Improve Transparency' },
  { value: 'compliance', label: 'Regulatory Compliance' },
  { value: 'efficiency', label: 'Operational Efficiency' },
  { value: 'innovation', label: 'Innovation & Differentiation' },
];

// Initial state
const initialData: WizardData = {
  asset: {
    assetType: '',
    assetName: '',
    estimatedValue: '',
    location: '',
    description: '',
  },
  contact: {
    fullName: '',
    email: '',
    company: '',
    phone: '',
    preferredContact: 'email',
  },
  interest: {
    timeline: '',
    budget: '',
    goals: [],
    additionalInfo: '',
  },
};

// Component
export const RWATInterestWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update asset data
  const updateAsset = useCallback((field: keyof AssetDetails, value: string) => {
    setData(prev => ({
      ...prev,
      asset: { ...prev.asset, [field]: value },
    }));
  }, []);

  // Update contact data
  const updateContact = useCallback((field: keyof ContactInfo, value: string) => {
    setData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }, []);

  // Update interest data
  const updateInterest = useCallback((field: keyof InterestDetails, value: string | string[]) => {
    setData(prev => ({
      ...prev,
      interest: { ...prev.interest, [field]: value },
    }));
  }, []);

  // Toggle goal selection
  const toggleGoal = useCallback((goal: string) => {
    setData(prev => {
      const goals = prev.interest.goals.includes(goal)
        ? prev.interest.goals.filter(g => g !== goal)
        : [...prev.interest.goals, goal];
      return {
        ...prev,
        interest: { ...prev.interest, goals },
      };
    });
  }, []);

  // Validate current step
  const validateStep = (): boolean => {
    setError(null);

    switch (currentStep) {
      case 0: // Asset
        if (!data.asset.assetType) {
          setError('Please select an asset type');
          return false;
        }
        if (!data.asset.assetName.trim()) {
          setError('Please enter an asset name');
          return false;
        }
        return true;

      case 1: // Contact
        if (!data.contact.fullName.trim()) {
          setError('Please enter your full name');
          return false;
        }
        if (!data.contact.email.trim() || !data.contact.email.includes('@')) {
          setError('Please enter a valid email address');
          return false;
        }
        return true;

      case 2: // Interest
        if (!data.interest.timeline) {
          setError('Please select a timeline');
          return false;
        }
        if (data.interest.goals.length === 0) {
          setError('Please select at least one goal');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Submit the wizard
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v12/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'REAL_WORLD_ASSETS',
          useCase: data.asset.assetType,
          actionType: 'INQUIRY',
          source: 'rwat_wizard',
          metadata: JSON.stringify({
            asset: data.asset,
            contact: data.contact,
            interest: data.interest,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit interest');
      }

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success state
  if (isComplete) {
    return (
      <div className="rwat-wizard-success">
        <div className="success-icon">✓</div>
        <h2>Thank You!</h2>
        <p>Your interest in Real World Asset Tokenization has been recorded.</p>
        <p>Our team will contact you within 24-48 hours.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Submit Another Interest
        </button>
      </div>
    );
  }

  return (
    <div className="rwat-wizard">
      {/* Progress indicator */}
      <div className="wizard-progress">
        {WIZARD_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`progress-step ${index <= currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">{index < currentStep ? '✓' : index + 1}</div>
            <div className="step-label">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="wizard-content">
        <h2>{WIZARD_STEPS[currentStep]!.title}</h2>
        <p className="step-description">{WIZARD_STEPS[currentStep]!.description}</p>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Asset Information */}
        {currentStep === 0 && (
          <div className="wizard-step asset-step">
            <div className="form-group">
              <label>Asset Type *</label>
              <select
                value={data.asset.assetType}
                onChange={e => updateAsset('assetType', e.target.value)}
              >
                <option value="">Select asset type...</option>
                {ASSET_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Asset Name / Description *</label>
              <input
                type="text"
                value={data.asset.assetName}
                onChange={e => updateAsset('assetName', e.target.value)}
                placeholder="e.g., 123 Main St Commercial Building"
              />
            </div>

            <div className="form-group">
              <label>Estimated Value</label>
              <input
                type="text"
                value={data.asset.estimatedValue}
                onChange={e => updateAsset('estimatedValue', e.target.value)}
                placeholder="e.g., $1,000,000"
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={data.asset.location}
                onChange={e => updateAsset('location', e.target.value)}
                placeholder="City, Country"
              />
            </div>

            <div className="form-group">
              <label>Additional Details</label>
              <textarea
                value={data.asset.description}
                onChange={e => updateAsset('description', e.target.value)}
                placeholder="Any additional information about the asset..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Contact Information */}
        {currentStep === 1 && (
          <div className="wizard-step contact-step">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={data.contact.fullName}
                onChange={e => updateContact('fullName', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                value={data.contact.email}
                onChange={e => updateContact('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label>Company / Organization</label>
              <input
                type="text"
                value={data.contact.company}
                onChange={e => updateContact('company', e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={data.contact.phone}
                onChange={e => updateContact('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label>Preferred Contact Method</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="preferredContact"
                    value="email"
                    checked={data.contact.preferredContact === 'email'}
                    onChange={e => updateContact('preferredContact', e.target.value)}
                  />
                  Email
                </label>
                <label>
                  <input
                    type="radio"
                    name="preferredContact"
                    value="phone"
                    checked={data.contact.preferredContact === 'phone'}
                    onChange={e => updateContact('preferredContact', e.target.value)}
                  />
                  Phone
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Interest Details */}
        {currentStep === 2 && (
          <div className="wizard-step interest-step">
            <div className="form-group">
              <label>Timeline *</label>
              <select
                value={data.interest.timeline}
                onChange={e => updateInterest('timeline', e.target.value)}
              >
                <option value="">Select timeline...</option>
                {TIMELINE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Budget Range</label>
              <select
                value={data.interest.budget}
                onChange={e => updateInterest('budget', e.target.value)}
              >
                <option value="">Select budget range...</option>
                {BUDGET_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Goals * (Select all that apply)</label>
              <div className="checkbox-group">
                {GOAL_OPTIONS.map(goal => (
                  <label key={goal.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={data.interest.goals.includes(goal.value)}
                      onChange={() => toggleGoal(goal.value)}
                    />
                    {goal.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Additional Information</label>
              <textarea
                value={data.interest.additionalInfo}
                onChange={e => updateInterest('additionalInfo', e.target.value)}
                placeholder="Any specific questions or requirements..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="wizard-step review-step">
            <div className="review-section">
              <h3>Asset Information</h3>
              <dl>
                <dt>Type:</dt>
                <dd>{ASSET_TYPES.find(t => t.value === data.asset.assetType)?.label || '-'}</dd>
                <dt>Name:</dt>
                <dd>{data.asset.assetName || '-'}</dd>
                <dt>Value:</dt>
                <dd>{data.asset.estimatedValue || '-'}</dd>
                <dt>Location:</dt>
                <dd>{data.asset.location || '-'}</dd>
              </dl>
            </div>

            <div className="review-section">
              <h3>Contact Information</h3>
              <dl>
                <dt>Name:</dt>
                <dd>{data.contact.fullName}</dd>
                <dt>Email:</dt>
                <dd>{data.contact.email}</dd>
                <dt>Company:</dt>
                <dd>{data.contact.company || '-'}</dd>
                <dt>Phone:</dt>
                <dd>{data.contact.phone || '-'}</dd>
              </dl>
            </div>

            <div className="review-section">
              <h3>Interest Details</h3>
              <dl>
                <dt>Timeline:</dt>
                <dd>{TIMELINE_OPTIONS.find(t => t.value === data.interest.timeline)?.label || '-'}</dd>
                <dt>Budget:</dt>
                <dd>{BUDGET_OPTIONS.find(b => b.value === data.interest.budget)?.label || '-'}</dd>
                <dt>Goals:</dt>
                <dd>
                  {data.interest.goals
                    .map(g => GOAL_OPTIONS.find(go => go.value === g)?.label)
                    .join(', ') || '-'}
                </dd>
              </dl>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="wizard-navigation">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="btn-secondary"
        >
          Previous
        </button>

        {currentStep < WIZARD_STEPS.length - 1 ? (
          <button onClick={nextStep} className="btn-primary">
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary btn-submit"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Interest'}
          </button>
        )}
      </div>
    </div>
  );
};

export default RWATInterestWizard;
